type ChatStreamMessagePart = {
  readonly [key: string]: unknown
  readonly text?: string
  readonly type: string
}

export type ChatStreamMessage = {
  readonly [key: string]: unknown
  readonly id: string
  readonly parts: readonly ChatStreamMessagePart[]
  readonly role: "system" | "user" | "assistant"
}

/** Validated chat turn sent to chat streaming infrastructure. */
export type ChatStreamRequest = {
  readonly chatId: string
  readonly message: ChatStreamMessage
  readonly messageId?: string
  readonly trigger?: "submit-message" | "regenerate-message"
}

/** Session-derived identity the framework layer attaches to chat requests. */
export type ChatRequestContext = {
  readonly organizationId: string
  readonly userId: string
}
