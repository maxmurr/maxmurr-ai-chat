import {
  getToolOrDynamicToolName,
  isToolOrDynamicToolUIPart,
  type UIMessage,
} from "ai"

import {
  buildMockChatMessages,
  type MockChatAttachment,
  type MockChatMessage,
  type MockChatSource,
  type MockChatTool,
} from "@/lib/mock-chat-conversations"

/** Client metadata retained for seeded messages and local attachment labels. */
export type ChatMessageMetadata = {
  readonly attachments?: readonly MockChatAttachment[]
  readonly seededDisplayMessage?: MockChatMessage
}

/** AI SDK message shape shared by chat store and Mastra route. */
export type ChatUIMessage = UIMessage<ChatMessageMetadata>

/** Converts seeded demo history into AI SDK messages used as model context. */
export function buildInitialChatUiMessages(
  conversationTitle?: string
): ChatUIMessage[] {
  return buildMockChatMessages(conversationTitle).map((message) => ({
    id: message.id,
    metadata: { seededDisplayMessage: message },
    parts: [{ type: "text", text: message.content }],
    role: message.role,
  }))
}

function getChatSourceLabel(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/** Adapts AI SDK stream parts to existing chat presentation model. */
export function convertChatUiMessageToDisplayMessage(
  message: ChatUIMessage
): MockChatMessage | null {
  if (message.metadata?.seededDisplayMessage) {
    return message.metadata.seededDisplayMessage
  }

  if (message.role === "system") {
    return null
  }

  const text = message.parts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n\n")
  const reasoningParts = message.parts.flatMap((part) =>
    part.type === "reasoning" ? [part.text] : []
  )
  const attachments: MockChatAttachment[] = [
    ...(message.metadata?.attachments ?? []),
    ...message.parts.flatMap((part) =>
      part.type === "file"
        ? [
            {
              filename: part.filename ?? "Attachment",
              mediaType: part.mediaType,
            },
          ]
        : []
    ),
  ]
  const sources = message.parts.flatMap((part): MockChatSource[] => {
    if (part.type === "source-url") {
      return [
        {
          href: part.url,
          label: getChatSourceLabel(part.url),
          title: part.title ?? part.url,
        },
      ]
    }

    if (part.type === "source-document") {
      return [
        {
          label: part.filename ?? part.mediaType,
          title: part.title,
        },
      ]
    }

    return []
  })
  const tools = message.parts.flatMap((part): MockChatTool[] => {
    if (!isToolOrDynamicToolUIPart(part)) {
      return []
    }

    const state =
      part.state === "output-available"
        ? "completed"
        : part.state === "output-error"
          ? "failed"
          : "running"
    const payload =
      part.state === "output-available"
        ? { input: part.input, output: part.output }
        : part.state === "output-error"
          ? { error: part.errorText, input: part.input }
          : { input: part.input }

    return [
      {
        id: part.toolCallId,
        name: getToolOrDynamicToolName(part),
        payload,
        state,
      },
    ]
  })

  return {
    content: text,
    id: message.id,
    role: message.role,
    ...(attachments.length > 0 ? { attachments } : {}),
    ...(reasoningParts.length > 0
      ? { reasoning: reasoningParts.join("\n\n") }
      : {}),
    ...(sources.length > 0 ? { sources } : {}),
    ...(tools.length > 0 ? { tools } : {}),
  }
}
