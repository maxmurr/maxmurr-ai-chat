import type { ChatListPage, ChatVisibility } from "@/src/entities/models/chat";

/** Serializable owner Chat row shared by server render and cursor API. */
export type ChatListBrowserEntry = {
  activeStreamId: string | null;
  hasUnreadResponse: boolean;
  id: string;
  pinned: boolean;
  projectId: string | null;
  projectName: string | null;
  publicToken: string | null;
  searchSnippet: string | null;
  title: string;
  updatedAt: string;
  visibility: ChatVisibility;
};

/** Serializable cursor returned by owner Chat-list API. */
export type ChatListCursorPayload = {
  id: string;
  updatedAt: string;
};

/** JSON payload consumed by infinite Chat list. */
export type ChatListPagePayload = {
  chats: ChatListBrowserEntry[];
  nextCursor: ChatListCursorPayload | null;
};

/** Removes persistence-only Chat fields and serializes list dates. */
export function serializeChatListPage(page: ChatListPage): ChatListPagePayload {
  return {
    chats: page.chats.map(
      ({
        activeStreamId,
        hasUnreadResponse,
        id,
        pinned,
        projectId,
        projectName,
        publicToken,
        searchSnippet,
        title,
        updatedAt,
        visibility,
      }) => ({
        activeStreamId,
        hasUnreadResponse,
        id,
        pinned,
        projectId,
        projectName,
        publicToken,
        searchSnippet,
        title,
        updatedAt: updatedAt.toISOString(),
        visibility,
      })
    ),
    nextCursor: page.nextCursor
      ? {
          id: page.nextCursor.id,
          updatedAt: page.nextCursor.updatedAt.toISOString(),
        }
      : null,
  };
}
