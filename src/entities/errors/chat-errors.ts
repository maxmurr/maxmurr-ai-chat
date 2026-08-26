/** Reports malformed input at the chat controller seam. */
export class InvalidChatRequestError extends Error {
  constructor(options?: ErrorOptions) {
    super("Invalid chat request.", options)
    this.name = "InvalidChatRequestError"
  }
}

/** Hides chat provider failures from outer layers. */
export class ChatUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super("Chat is unavailable.", options)
    this.name = "ChatUnavailableError"
  }
}
