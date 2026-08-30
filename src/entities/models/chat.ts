export const CHAT_RESPONSE_STREAM_STALE_AFTER_MS = 90_000;

export const chatVisibilities = ["private", "workspace", "public"] as const;

/** Who can see a chat: owner only, workspace members, or anyone with the public link. */
export type ChatVisibility = (typeof chatVisibilities)[number];

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
