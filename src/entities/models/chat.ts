export const chatVisibilities = ["private", "workspace", "public"] as const

/** Who can see a chat: owner only, workspace members, or anyone with the public link. */
export type ChatVisibility = (typeof chatVisibilities)[number]

/** One persisted conversation owned by its creator and scoped to a workspace. */
export type Chat = {
  readonly id: string
  readonly organizationId: string
  readonly ownerId: string
  readonly title: string
  readonly visibility: ChatVisibility
  readonly publicToken: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

/** One persisted turn, stored as AI SDK UIMessage parts. */
export type ChatMessage = {
  readonly id: string
  readonly role: "system" | "user" | "assistant"
  readonly parts: readonly unknown[]
  readonly metadata?: unknown
}

/** Viewing never grants writing: only the owner appends, renames, shares, deletes. */
export function canViewChat(
  chat: Pick<Chat, "ownerId" | "visibility">,
  viewer: { readonly isWorkspaceMember: boolean; readonly userId: string }
) {
  if (viewer.userId === chat.ownerId) {
    return true
  }

  return chat.visibility !== "private" && viewer.isWorkspaceMember
}
