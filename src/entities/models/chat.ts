export const CHAT_RESPONSE_STREAM_STALE_AFTER_MS = 90_000;

export const chatVisibilities = ["private", "workspace", "public"] as const;
export const chatListFilters = ["all", "pinned", "unread"] as const;

/** Who can see a chat: owner only, workspace members, or anyone with the public link. */
export type ChatVisibility = (typeof chatVisibilities)[number];

/** Owner chat-list filter accepted by paginated reads. */
export type ChatListFilter = (typeof chatListFilters)[number];

/** Stable cursor for chats ordered newest first. */
export type ChatListCursor = {
  readonly id: string;
  readonly updatedAt: Date;
};

/** Validated owner chat-list request passed to persistence. */
export type ChatListPageRequest = {
  readonly cursor: ChatListCursor | null;
  readonly filter: ChatListFilter;
  readonly limit: number;
  readonly query: string;
};

/** Workspace and owner identity required by private Chat operations. */
export type ChatOwnerScope = {
  readonly organizationId: string;
  readonly ownerId: string;
};

/** One persisted conversation owned by its creator and scoped to a workspace. */
export type Chat = {
  readonly activeStreamId: string | null;
  readonly createdAt: Date;
  readonly hasUnreadResponse: boolean;
  readonly id: string;
  readonly organizationId: string;
  readonly ownerId: string;
  readonly pinned: boolean;
  readonly projectId: string | null;
  readonly publicToken: string | null;
  readonly title: string;
  readonly updatedAt: Date;
  readonly visibility: ChatVisibility;
};

/** Owner sidebar Chat projection with live Project name for display. */
export type ChatSidebarEntry = Chat & {
  readonly projectName: string | null;
};

/** Owner chat-list row with optional matching Message excerpt. */
export type ChatListEntry = ChatSidebarEntry & {
  readonly searchSnippet: string | null;
};

/** One cursor page of owner Chats. */
export type ChatListPage = {
  readonly chats: ChatListEntry[];
  readonly nextCursor: ChatListCursor | null;
};

/** Trusted User profile attached to a user Message for shared attribution. */
export type ChatMessageSender = {
  readonly avatarUrl?: string;
  readonly displayName: string;
  readonly userId: string;
};

/** Checks whether persisted metadata contains a complete Message sender. */
export function isChatMessageSender(
  value: unknown
): value is ChatMessageSender {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const sender = value as Record<string, unknown>;
  return (
    typeof sender.displayName === "string" &&
    sender.displayName.trim().length > 0 &&
    typeof sender.userId === "string" &&
    sender.userId.length > 0 &&
    (sender.avatarUrl === undefined || typeof sender.avatarUrl === "string")
  );
}

/** One persisted turn, stored as AI SDK UIMessage parts. */
export type ChatMessage = {
  readonly id: string;
  readonly role: "system" | "user" | "assistant";
  readonly parts: readonly unknown[];
  readonly metadata?: unknown;
};

/** Viewing never grants writing: only the owner appends, renames, shares, deletes. */
export function canViewChat(
  chat: Pick<Chat, "ownerId" | "visibility">,
  viewer: { readonly isWorkspaceMember: boolean; readonly userId: string }
) {
  if (viewer.userId === chat.ownerId) {
    return true;
  }

  return chat.visibility !== "private" && viewer.isWorkspaceMember;
}
