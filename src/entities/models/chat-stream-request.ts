type ChatStreamMessagePart = {
  readonly [key: string]: unknown
  readonly text?: string
  readonly type: string
}

type ChatStreamMessage = {
  readonly [key: string]: unknown
  readonly id: string
  readonly parts: readonly ChatStreamMessagePart[]
  readonly role: "system" | "user" | "assistant"
}

/** Validated conversation sent to chat streaming infrastructure. */
export type ChatStreamRequest = {
  readonly messages: readonly ChatStreamMessage[]
  readonly trigger?: "submit-message" | "regenerate-message"
}
