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
import type { StreamChatResponse } from "@/src/application/services/chat-stream.service.interface"
import {
  ChatAccessDeniedError,
  ChatUnavailableError,
} from "@/src/entities/errors/chat-errors"
import type { ChatMessage } from "@/src/entities/models/chat"
import type { ChatStreamMessage } from "@/src/entities/models/chat-stream-request"
import { mastraRuntime } from "@/src/infrastructure/ai/mastra/mastra-runtime"

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
  return text ? text.slice(0, CHAT_TITLE_LIMIT) : "New chat"
}

async function generateAndSaveChatTitle(
  chatRepository: ChatRepository,
  chatId: string,
  userText: string
) {
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

/** Creates streaming chat service that persists each turn around a Mastra run. */
export function createMastraChatStreamService(
  chatRepository: ChatRepository
): StreamChatResponse {
  return async (request, context, abortSignal) => {
    const { chatId, message, messageId, trigger } = request

    const existingChat = await chatRepository.getChatById(chatId)

    if (existingChat && existingChat.ownerId !== context.userId) {
      throw new ChatAccessDeniedError()
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

      await chatRepository.saveMessage(chatId, message)

      const modelMessages = [
        ...history.filter((entry) => entry.id !== message.id),
        message,
      ].slice(-MODEL_MESSAGE_LIMIT) as unknown as UIMessage[]

      const stream = await handleChatStream({
        agentId: "chat-assistant",
        experimentalTransform: smoothStream({
          delayInMs: 20,
          chunking: "word",
        }),
        mastra: mastraRuntime,
        onError: (error) => {
          console.error(
            "Chat stream failed.",
            error instanceof Error ? error.message : "Unknown error"
          )
          return "Chat response failed."
        },
        params: {
          abortSignal,
          messages: modelMessages,
          trigger,
        },
        sendReasoning: true,
        sendSources: true,
        version: "v7",
      })

      return createUIMessageStreamResponse({
        stream: createUIMessageStream<UIMessage>({
          execute: ({ writer }) => {
            writer.merge(stream as unknown as ReadableStream<UIMessageChunk>)
          },
          onEnd: async ({ responseMessage }) => {
            if (responseMessage.parts.length > 0) {
              await chatRepository.saveMessage(
                chatId,
                responseMessage as ChatMessage
              )
            }
          },
          originalMessages: modelMessages,
        }),
      })
    } catch (error) {
      throw new ChatUnavailableError({ cause: error })
    }
  }
}
