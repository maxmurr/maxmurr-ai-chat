import { z } from "zod";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type { LibraryService } from "@/src/application/services/library.service.interface";
import {
  ChatAccessDeniedError,
  ChatStreamConflictError,
  InvalidChatRequestError,
} from "@/src/entities/errors/chat-errors";
import {
  canViewChat,
  CHAT_RESPONSE_STREAM_STALE_AFTER_MS,
  chatListFilters,
  chatVisibilities,
  type Chat,
  type ChatListEntry,
  type ChatMessage,
  type ChatOwnerScope,
} from "@/src/entities/models/chat";
import {
  getMessageLibraryFileIds,
  type LibraryOwnerScope,
} from "@/src/entities/models/library";

const chatTitleSchema = z.string().trim().min(1).max(80);
const chatListPageRequestSchema = z.object({
  cursor: z
    .object({ id: z.uuid(), updatedAt: z.date() })
    .nullable()
    .default(null),
  filter: z.enum(chatListFilters).default("all"),
  limit: z.number().int().min(1).max(50).default(30),
  query: z.string().trim().max(200).default(""),
});
const chatVisibilitySchema = z.enum(chatVisibilities);
const chatMessageFeedbackMetadataSchema = z.object({
  langfuseTraceId: z.string().regex(/^[0-9a-f]{32}$/),
});

function withoutOwnerInternals(chat: Chat): Chat {
  return {
    ...chat,
    activeStreamId: null,
    hasUnreadResponse: false,
    projectId: null,
    publicToken: null,
  };
}

function withFileAvailability(
  message: ChatMessage,
  existingFileIds: ReadonlySet<string>
): ChatMessage {
  const fileIds = getMessageLibraryFileIds(message.parts);

  if (fileIds.length === 0) {
    return message;
  }

  const metadata =
    typeof message.metadata === "object" && message.metadata !== null
      ? message.metadata
      : {};

  return {
    ...message,
    metadata: {
      ...metadata,
      libraryFileAvailability: Object.fromEntries(
        fileIds.map((fileId) => [fileId, existingFileIds.has(fileId)])
      ),
    },
  };
}

/** Validated chat library controller resolved by application composition root. */
export type ChatLibraryController = ReturnType<
  typeof createChatLibraryController
>;

/** Creates owner-scoped chat read and management operations over the repository. */
export function createChatLibraryController(
  chatRepository: ChatRepository,
  libraryService: LibraryService
) {
  async function projectFileAvailability(
    messages: ChatMessage[],
    scope: LibraryOwnerScope | null
  ) {
    const fileIds = [
      ...new Set(
        messages.flatMap((entry) => getMessageLibraryFileIds(entry.parts))
      ),
    ];
    const existingFileIds = new Set(
      scope ? await libraryService.findExistingFileIds(fileIds, scope) : []
    );
    return messages.map((message) =>
      withFileAvailability(message, existingFileIds)
    );
  }

  async function requireOwnedChat(chatId: string, userId: string) {
    const chat = await chatRepository.getChatById(chatId);

    if (!chat || chat.ownerId !== userId) {
      throw new ChatAccessDeniedError();
    }

    return chat;
  }

  async function finishStaleChatStreams(
    chats: ReadonlyArray<
      Pick<ChatListEntry, "activeStreamId" | "id" | "updatedAt">
    >
  ) {
    const staleStreams = chats.filter(
      (chat) =>
        chat.activeStreamId &&
        Date.now() - chat.updatedAt.getTime() >=
          CHAT_RESPONSE_STREAM_STALE_AFTER_MS
    );

    if (staleStreams.length === 0) {
      return false;
    }

    await Promise.all(
      staleStreams.map((chat) =>
        chatRepository.finishChatResponseStream(
          chat.id,
          chat.activeStreamId!,
          false
        )
      )
    );
    return true;
  }

  return {
    async deleteChat(chatId: string, userId: string) {
      await requireOwnedChat(chatId, userId);

      if (!(await chatRepository.deleteChat(chatId))) {
        throw new ChatStreamConflictError();
      }
    },

    /** Deletes inactive owner Chats in one scoped operation. */
    async deleteOwnedChats(chatIds: readonly string[], scope: ChatOwnerScope) {
      const deletedChatIds = await chatRepository.deleteOwnedChats(
        chatIds,
        scope
      );
      const deletedChatIdSet = new Set(deletedChatIds);

      return {
        blockedChatIds: chatIds.filter((id) => !deletedChatIdSet.has(id)),
        deletedChatIds,
      };
    },

    /** Returns the Langfuse trace only for an owned assistant message. */
    async getOwnedAssistantMessageLangfuseTraceId(
      chatId: string,
      userId: string,
      messageId: string
    ) {
      await requireOwnedChat(chatId, userId);
      const message = (await chatRepository.getChatMessages(chatId)).find(
        (entry) => entry.id === messageId
      );

      if (!message || message.role !== "assistant") {
        throw new ChatAccessDeniedError();
      }

      const metadata = chatMessageFeedbackMetadataSchema.safeParse(
        message.metadata
      );

      if (!metadata.success) {
        throw new InvalidChatRequestError({ cause: metadata.error });
      }

      return metadata.data.langfuseTraceId;
    },

    /** Returns the chat as seen by this user, or null when it must stay hidden. */
    async getChatForViewer(
      chatId: string,
      userId: string,
      activeOrganizationId: string
    ) {
      const chat = await chatRepository.getChatById(chatId);

      if (!chat || chat.organizationId !== activeOrganizationId) {
        return null;
      }

      const isOwner = chat.ownerId === userId;
      const isWorkspaceMember =
        isOwner ||
        (await chatRepository.isWorkspaceMember(chat.organizationId, userId));

      if (!canViewChat(chat, { isWorkspaceMember, userId })) {
        return null;
      }

      const messages = await chatRepository.getChatMessages(chatId);

      return {
        chat: isOwner ? chat : withoutOwnerInternals(chat),
        isOwner,
        messages: await projectFileAvailability(
          messages,
          isOwner
            ? { organizationId: activeOrganizationId, ownerId: userId }
            : null
        ),
      };
    },

    async getPublicChat(publicToken: string) {
      const chat = await chatRepository.getChatByPublicToken(publicToken);

      if (!chat) {
        return null;
      }

      return {
        chat: withoutOwnerInternals(chat),
        messages: await projectFileAvailability(
          await chatRepository.getChatMessages(chat.id),
          null
        ),
      };
    },

    /** Lists one validated cursor page of owner Chats. */
    async listOwnChatsPage(request: unknown, scope: ChatOwnerScope) {
      const parsedRequest = chatListPageRequestSchema.safeParse(request);

      if (!parsedRequest.success) {
        throw new InvalidChatRequestError({ cause: parsedRequest.error });
      }

      let page = await chatRepository.listOwnChatsPage({
        ...parsedRequest.data,
        ...scope,
      });

      if (await finishStaleChatStreams(page.chats)) {
        page = await chatRepository.listOwnChatsPage({
          ...parsedRequest.data,
          ...scope,
        });
      }

      return page;
    },

    async listSidebarChats(organizationId: string, userId: string) {
      const [initialOwnChats, teamChats] = await Promise.all([
        chatRepository.listOwnChats(organizationId, userId),
        chatRepository.listTeamChats(organizationId, userId),
      ]);
      const ownChats = (await finishStaleChatStreams(initialOwnChats))
        ? await chatRepository.listOwnChats(organizationId, userId)
        : initialOwnChats;

      return { ownChats, teamChats };
    },

    async markChatRead(
      chatId: string,
      userId: string,
      activeOrganizationId: string,
      assistantMessageId: string
    ) {
      const chat = await requireOwnedChat(chatId, userId);

      if (chat.organizationId !== activeOrganizationId) {
        throw new ChatAccessDeniedError();
      }

      await chatRepository.markChatRead(chatId, assistantMessageId);
    },

    async pinChat(chatId: string, userId: string, pinned: boolean) {
      await requireOwnedChat(chatId, userId);
      await chatRepository.updateChatPinned(chatId, pinned);
    },

    async renameChat(chatId: string, userId: string, title: unknown) {
      const result = chatTitleSchema.safeParse(title);

      if (!result.success) {
        throw new InvalidChatRequestError({ cause: result.error });
      }

      await requireOwnedChat(chatId, userId);
      await chatRepository.updateChatTitle(chatId, result.data);
    },

    /** Sets visibility; the public token exists exactly while the chat is public. */
    async updateChatSharing(
      chatId: string,
      userId: string,
      visibility: unknown
    ) {
      const result = chatVisibilitySchema.safeParse(visibility);

      if (!result.success) {
        throw new InvalidChatRequestError({ cause: result.error });
      }

      const chat = await requireOwnedChat(chatId, userId);
      const publicToken =
        result.data === "public"
          ? (chat.publicToken ?? crypto.randomUUID())
          : null;

      await chatRepository.updateChatSharing(chatId, {
        publicToken,
        visibility: result.data,
      });

      return { publicToken, visibility: result.data };
    },
  };
}
