import type { ChatModelId } from "@/src/entities/models/chat-model";

type ChatStreamMessagePart = {
  readonly [key: string]: unknown;
  readonly filename?: string;
  readonly mediaType?: string;
  readonly text?: string;
  readonly type: string;
  readonly url?: string;
};

export type ChatStreamMessage = {
  readonly [key: string]: unknown;
  readonly id: string;
  readonly parts: readonly ChatStreamMessagePart[];
  readonly role: "system" | "user" | "assistant";
};

/** Validated chat turn sent to chat streaming infrastructure. */
export type ChatStreamRequest = {
  readonly chatId: string;
  readonly message: ChatStreamMessage;
  readonly messageId?: string;
  readonly modelId: ChatModelId;
  readonly projectId?: string;
  readonly streamId: string;
  readonly trigger?: "submit-message" | "regenerate-message";
  readonly webSearchEnabled: boolean;
};

/** Session-derived identity the framework layer attaches to chat requests. */
export type ChatRequestContext = {
  readonly organizationId: string;
  readonly userAvatarUrl?: string;
  readonly userDisplayName: string;
  readonly userId: string;
};
