import { handleChatStream, smoothStream } from "@mastra/ai-sdk"
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  type UIMessage,
  type UIMessageChunk,
} from "ai"
import { after } from "next/server"

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface"
import type { LibraryService } from "@/src/application/services/library.service.interface"
import type { StreamChatResponse } from "@/src/application/services/chat-stream.service.interface"
import {
  ChatAccessDeniedError,
  ChatUnavailableError,
} from "@/src/entities/errors/chat-errors"
import { LibraryAccessDeniedError } from "@/src/entities/errors/library-errors"
import type { ChatMessage } from "@/src/entities/models/chat"
import type { ChatStreamMessage } from "@/src/entities/models/chat-stream-request"
import { getMessageLibraryFileIds } from "@/src/entities/models/library"
import { mastraRuntime } from "@/src/infrastructure/ai/mastra/mastra-runtime"
import {
  hydrateLibraryFilesForModel,
  saveAssistantGeneratedFiles,
} from "@/src/infrastructure/services/chat-library-files.service"

const MODEL_MESSAGE_LIMIT = 100
const CHAT_TITLE_LIMIT = 80

function extractMessageText(message: ChatStreamMessage) {
  return message.parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
}

function fallbackChatTitle(message: ChatStreamMessage) {
  const text = extractMessageText(message).trim()
  const filename = message.parts.find(
    (part) => part.type === "file" && typeof part.filename === "string"
  )?.filename
  return (text || filename || "New chat").slice(0, CHAT_TITLE_LIMIT)
}

async function generateAndSaveChatTitle(
  chatRepository: ChatRepository,
  chatId: string,
  userText: string
) {
  if (!userText.trim()) {
    return
  }

  try {
    const { text } = await generateText({
      model: "openai/gpt-5.6-luna",
      prompt: [
        "Write a short title (at most six words) for a chat that starts with the user message below.",
        "Reply with the title only: no quotes, no punctuation at the end.",
        "",
        userText.slice(0, 2_000),
      ].join("\n"),
    })
    const title = text.trim().slice(0, CHAT_TITLE_LIMIT)

    if (title) {
      await chatRepository.updateChatTitle(chatId, title)
    }
  } catch (error) {
    console.error(
      "Chat title generation failed.",
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

/** Creates streaming Chat service that persists turns and Library Files. */
export function createMastraChatStreamService(
  chatRepository: ChatRepository,
  libraryService: LibraryService
): StreamChatResponse {
  return async (request, context, abortSignal) => {
    const { chatId, message, messageId, trigger } = request
    const existingChat = await chatRepository.getChatById(chatId)

    if (existingChat) {
      const isActiveWorkspaceMember = await chatRepository.isWorkspaceMember(
        context.organizationId,
        context.userId
      )

      if (
        existingChat.ownerId !== context.userId ||
        existingChat.organizationId !== context.organizationId ||
        !isActiveWorkspaceMember
      ) {
        throw new ChatAccessDeniedError()
      }
    }

    if (!existingChat) {
      const isMember = await chatRepository.isWorkspaceMember(
        context.organizationId,
        context.userId
      )

      if (!isMember) {
        throw new ChatAccessDeniedError()
      }

      await chatRepository.createChat({
        id: chatId,
        organizationId: context.organizationId,
        ownerId: context.userId,
        title: fallbackChatTitle(message),
      })
      after(() =>
        generateAndSaveChatTitle(
          chatRepository,
          chatId,
          extractMessageText(message)
        )
      )
    }

    const libraryScope = {
      organizationId: context.organizationId,
      ownerId: context.userId,
    }

    try {
      let history = await chatRepository.getChatMessages(chatId)

      if (trigger === "regenerate-message" && history.length > 0) {
        const pivotId = messageId ?? history.at(-1)!.id
        const pivotIndex = history.findIndex((entry) => entry.id === pivotId)

        if (pivotIndex !== -1) {
          // Regenerating an assistant message discards it; regenerating after a
          // user message keeps that message and discards what followed.
          const inclusive = history[pivotIndex].role === "assistant"
          await chatRepository.deleteMessagesFrom(chatId, {
            inclusive,
            messageId: pivotId,
          })
          history = history.slice(0, inclusive ? pivotIndex : pivotIndex + 1)
        }
      }

      await libraryService.setChatFileProvenance(
        getMessageLibraryFileIds(message.parts),
        { provenanceChatId: chatId, provenanceMessageId: message.id },
        libraryScope
      )
      await chatRepository.saveMessage(chatId, message)

      const persistedModelMessages = [
        ...history.filter((entry) => entry.id !== message.id),
        message,
      ].slice(-MODEL_MESSAGE_LIMIT) as unknown as UIMessage[]
      const providerMessages = await hydrateLibraryFilesForModel(
        persistedModelMessages,
        libraryService,
        libraryScope
      )
      const stream = await handleChatStream({
        agentId: "chat-assistant",
        experimentalTransform: smoothStream({
          delayInMs: 20,
          chunking: "word",
        }),
        mastra: mastraRuntime,
        messageMetadata: ({ part }) =>
          part.type === "start"
            ? { createdAt: new Date().toISOString() }
            : undefined,
        onError: (error) => {
          console.error(
            "Chat stream failed.",
            error instanceof Error ? error.message : "Unknown error"
          )
          return "Chat response failed."
        },
        params: {
          abortSignal,
          messages: providerMessages,
          providerOptions: {
            // OpenAI Responses accepts text/code file_data after adapter opt-in.
            openai: { passThroughUnsupportedFiles: true },
          },
          tracingOptions: {
            metadata: {
              langfuse: { organizationId: libraryScope.organizationId },
              sessionId: chatId,
              userId: context.userId,
            },
          },
          trigger,
        },
        sendReasoning: true,
        sendSources: true,
        version: "v7",
      })

      after(() => mastraRuntime.observability.flush())

      return createUIMessageStreamResponse({
        stream: createUIMessageStream<UIMessage>({
          execute: ({ writer }) => {
            writer.merge(stream as unknown as ReadableStream<UIMessageChunk>)
          },
          onEnd: async ({ responseMessage }) => {
            if (responseMessage.parts.length === 0) {
              return
            }

            let persistedResponse = responseMessage

            try {
              persistedResponse = await saveAssistantGeneratedFiles(
                responseMessage,
                chatId,
                libraryService,
                libraryScope
              )
            } catch (error) {
              console.error(
                "Assistant File persistence failed.",
                error instanceof Error ? error.message : "Unknown error"
              )
              persistedResponse = {
                ...responseMessage,
                parts: responseMessage.parts.flatMap((part) =>
                  part.type === "file" && part.url.startsWith("data:")
                    ? [
                        {
                          text: `Generated File unavailable: ${part.filename ?? part.mediaType}`,
                          type: "text" as const,
                        },
                      ]
                    : [part]
                ),
              }
            }

            await chatRepository.saveMessage(
              chatId,
              persistedResponse as ChatMessage
            )
          },
          originalMessages: persistedModelMessages,
        }),
      })
    } catch (error) {
      if (error instanceof LibraryAccessDeniedError) {
        throw new ChatAccessDeniedError({ cause: error })
      }

      throw new ChatUnavailableError({ cause: error })
    }
  }
}
