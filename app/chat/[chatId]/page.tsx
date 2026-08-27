import { notFound } from "next/navigation"

import { loadChatPageData } from "@/app/chat/chat-page-data"
import { ChatPageShell } from "@/components/chat/chat-page-shell"
import type { ChatUIMessage } from "@/src/interface-adapters/presenters/chat-message.presenter"

/** Renders one persisted chat for its owner or a read-only workspace viewer. */
export default async function ChatByIdPage(props: PageProps<"/chat/[chatId]">) {
  const { chatId } = await props.params
  const {
    activeWorkspaceId,
    chatLibrary,
    currentUser,
    ownChats,
    teamChats,
    userId,
    workspaces,
  } = await loadChatPageData()

  const view = await chatLibrary.getChatForViewer(chatId, userId)

  if (!view) {
    notFound()
  }

  return (
    <ChatPageShell
      activeWorkspaceId={activeWorkspaceId}
      chat={{
        id: view.chat.id,
        isOwner: view.isOwner,
        pinned: view.chat.pinned,
        publicToken: view.chat.publicToken,
        title: view.chat.title,
        visibility: view.chat.visibility,
      }}
      currentUser={currentUser}
      initialMessages={view.messages as ChatUIMessage[]}
      ownChats={ownChats}
      teamChats={teamChats}
      workspaces={workspaces}
    />
  )
}
