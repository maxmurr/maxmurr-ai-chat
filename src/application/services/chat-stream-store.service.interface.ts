/** Owner-scoped identity for one replayable Chat response stream. */
export type ChatStreamIdentity = {
  readonly chatId: string;
  readonly organizationId: string;
  readonly ownerId: string;
  readonly streamId: string;
};

/** Stores replayable chat SSE streams and relays explicit cancellation. */
export type ChatStreamStore = {
  cancelChatStream(identity: ChatStreamIdentity): Promise<void>;
  createChatStream(
    identity: ChatStreamIdentity,
    stream: ReadableStream<string>,
    onCancel: () => void
  ): Promise<void>;
  resumeChatStream(
    identity: ChatStreamIdentity
  ): Promise<ReadableStream<string> | null | undefined>;
};
