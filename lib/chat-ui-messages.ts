import {
  getToolOrDynamicToolName,
  isToolOrDynamicToolUIPart,
  type UIMessage,
} from "ai"

/** Describes one file shown with a chat message. */
export type ChatDisplayAttachment = {
  readonly filename: string
  readonly mediaType: string
}

/** Describes one source cited by a chat message. */
export type ChatDisplaySource = {
  readonly href?: string
  readonly label: string
  readonly title: string
}

/** Describes one tool call shown with a chat message. */
export type ChatDisplayTool = {
  readonly id: string
  readonly name: string
  readonly payload: Readonly<Record<string, unknown>>
  readonly state: "running" | "completed" | "failed"
}

/** Presentation model derived from an AI SDK chat message. */
export type ChatDisplayMessage = {
  readonly attachments?: readonly ChatDisplayAttachment[]
  readonly content: string
  readonly id: string
  readonly reasoning?: string
  readonly role: "assistant" | "user"
  readonly sources?: readonly ChatDisplaySource[]
  readonly tools?: readonly ChatDisplayTool[]
}

/** Client metadata retained for local attachment labels. */
export type ChatMessageMetadata = {
  readonly attachments?: readonly ChatDisplayAttachment[]
}

/** AI SDK message shape shared by chat store and Mastra route. */
export type ChatUIMessage = UIMessage<ChatMessageMetadata>

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
): ChatDisplayMessage | null {
  if (message.role === "system") {
    return null
  }

  const text = message.parts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n\n")
  const reasoningParts = message.parts.flatMap((part) =>
    part.type === "reasoning" ? [part.text] : []
  )
  const attachments: ChatDisplayAttachment[] = [
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
  const sources = message.parts.flatMap((part): ChatDisplaySource[] => {
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
  const tools = message.parts.flatMap((part): ChatDisplayTool[] => {
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
