import { loadChatPageData } from "@/app/chat/chat-page-data"
import { ChatPageShell } from "@/components/chat/chat-page-shell"

/** Requires an onboarded session before rendering empty new-chat page. */
export default async function ChatPage() {
  const { activeWorkspaceId, currentUser, ownChats, teamChats, workspaces } =
    await loadChatPageData()

  return (
    <ChatPageShell
      activeWorkspaceId={activeWorkspaceId}
      chat={{
        id: crypto.randomUUID(),
        isOwner: true,
        pinned: false,
        publicToken: null,
        title: "New chat",
        visibility: "private",
      }}
      currentUser={currentUser}
      ownChats={ownChats}
      teamChats={teamChats}
      workspaces={workspaces}
    />
  )
}
