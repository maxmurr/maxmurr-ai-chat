import { z } from "zod";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type {
  ChatStreamIdentity,
  ChatStreamStore,
} from "@/src/application/services/chat-stream-store.service.interface";
import {
  ChatAccessDeniedError,
  ChatUnavailableError,
  InvalidChatRequestError,
} from "@/src/entities/errors/chat-errors";
import {
  CHAT_RESPONSE_STREAM_STALE_AFTER_MS,
  type Chat,
} from "@/src/entities/models/chat";
import type { ChatRequestContext } from "@/src/entities/models/chat-stream-request";

const CHAT_STREAM_REGISTRATION_WAIT_MS = 5_000;
const CHAT_STREAM_REGISTRATION_RETRY_MS = 100;
const chatIdSchema = z.uuid();
const stopChatStreamRequestSchema = z.object({
  activeStreamId: z.uuid(),
  assistantMessage: z
    .object({
      id: z.string().min(1).max(200),
      metadata: z.unknown().optional(),
      parts: z
        .array(
          z
            .object({ type: z.string().trim().min(1).max(100) })
            .catchall(z.unknown())
        )
        .max(1_000),
      role: z.literal("assistant"),
    })
    .catchall(z.unknown())
    .optional(),
});

type ChatStreamLifecycleRepository = Pick<
  ChatRepository,
  "finishChatResponseStream" | "getChatById" | "saveMessageIfAbsent"
>;

function parseChatId(chatId: unknown) {
  const result = chatIdSchema.safeParse(chatId);

  if (!result.success) {
    throw new InvalidChatRequestError({ cause: result.error });
  }

  return result.data;
}

async function requireOwnedWorkspaceChat(
  chatRepository: ChatStreamLifecycleRepository,
  chatId: string,
  context: ChatRequestContext
) {
  const chat = await chatRepository.getChatById(chatId);

  if (
    !chat ||
    chat.ownerId !== context.userId ||
    chat.organizationId !== context.organizationId
  ) {
    throw new ChatAccessDeniedError();
  }

  return chat;
}

function isStaleChatStream(chat: Chat, streamId: string) {
  return (
    chat.activeStreamId === streamId &&
    Date.now() - chat.updatedAt.getTime() >= CHAT_RESPONSE_STREAM_STALE_AFTER_MS
  );
}

async function resumeRegisteredChatStream(
  chatStreamStore: ChatStreamStore,
  identity: ChatStreamIdentity
) {
  try {
    return await chatStreamStore.resumeChatStream(identity);
  } catch (error) {
    if (error instanceof Error && error.message === "Timeout waiting for ack") {
      return undefined;
    }

    throw error;
  }
}

/** Validates and coordinates owner resume and stop requests. */
export type ChatStreamLifecycleController = ReturnType<
  typeof createChatStreamLifecycleController
>;

/** Creates owner-scoped lifecycle operations over persisted stream identity. */
export function createChatStreamLifecycleController(
  chatRepository: ChatStreamLifecycleRepository,
  chatStreamStore: ChatStreamStore
) {
  return {
    async resumeChatStream(chatIdInput: unknown, context: ChatRequestContext) {
      const chatId = parseChatId(chatIdInput);
      const chat = await requireOwnedWorkspaceChat(
        chatRepository,
        chatId,
        context
      );
      const streamId = chat.activeStreamId;

      if (!streamId) {
        return null;
      }

      const streamIdentity = {
        chatId,
        organizationId: context.organizationId,
        ownerId: context.userId,
        streamId,
      };

      try {
        const registrationDeadline =
          Date.now() + CHAT_STREAM_REGISTRATION_WAIT_MS;
        let stream = await resumeRegisteredChatStream(
          chatStreamStore,
          streamIdentity
        );

        if (stream === undefined && isStaleChatStream(chat, streamId)) {
          await chatRepository.finishChatResponseStream(
            chatId,
            streamId,
            false
          );
          return null;
        }

        while (stream === undefined && Date.now() < registrationDeadline) {
          await new Promise((resolve) =>
            setTimeout(resolve, CHAT_STREAM_REGISTRATION_RETRY_MS)
          );
          stream = await resumeRegisteredChatStream(
            chatStreamStore,
            streamIdentity
          );
        }

        if (stream === undefined) {
          if (isStaleChatStream(chat, streamId)) {
            await chatRepository.finishChatResponseStream(
              chatId,
              streamId,
              false
            );
          }
          return null;
        }

        if (stream === null) {
          await chatRepository.finishChatResponseStream(
            chatId,
            streamId,
            false
          );
          return null;
        }

        return stream;
      } catch (error) {
        try {
          const latestChat = await chatRepository.getChatById(chatId);

          if (latestChat && isStaleChatStream(latestChat, streamId)) {
            await chatRepository.finishChatResponseStream(
              chatId,
              streamId,
              false
            );
            return null;
          }
        } catch {
          // Preserve the original stream-store failure.
        }

        throw new ChatUnavailableError({ cause: error });
      }
    },

    async stopChatStream(
      chatIdInput: unknown,
      requestInput: unknown,
      context: ChatRequestContext
    ) {
      const chatId = parseChatId(chatIdInput);
      const chat = await requireOwnedWorkspaceChat(
        chatRepository,
        chatId,
        context
      );
      const request = stopChatStreamRequestSchema.safeParse(requestInput);

      if (!request.success) {
        throw new InvalidChatRequestError({ cause: request.error });
      }

      const streamId = chat.activeStreamId;

      if (!streamId || request.data.activeStreamId !== streamId) {
        return;
      }

      try {
        if (request.data.assistantMessage) {
          await chatRepository.saveMessageIfAbsent(
            chatId,
            request.data.assistantMessage
          );
        }

        await chatStreamStore.cancelChatStream({
          chatId,
          organizationId: context.organizationId,
          ownerId: context.userId,
          streamId,
        });
        await chatRepository.finishChatResponseStream(chatId, streamId, false);
      } catch (error) {
        try {
          const latestChat = await chatRepository.getChatById(chatId);

          if (latestChat?.activeStreamId !== streamId) {
            return;
          }
        } catch {
          // Preserve the original stop failure.
        }

        throw new ChatUnavailableError({ cause: error });
      }
    },
  };
}
