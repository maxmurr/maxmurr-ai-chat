import { ChatAppShell } from "@/components/chat/chat-app-shell"
import type { ChatConversationEntry } from "@/components/chat/chat-conversation-item"
import { ChatConversationTitle } from "@/components/chat/chat-conversation-title"
import type { ChatHistoryEntry } from "@/components/chat/chat-history"
import { ChatPageHeader } from "@/components/chat/chat-page-header"
import { ChatShareDialog } from "@/components/chat/chat-share-dialog"
import { ChatThread } from "@/components/chat/chat-thread"
import { ChatThreadActions } from "@/components/chat/chat-thread-actions"
import { ChatTranscript } from "@/components/chat/chat-transcript"
import type { ChatWorkspaceSummary } from "@/components/chat/chat-workspace-switcher"
import type { ChatUIMessage } from "@/src/interface-adapters/presenters/chat-message.presenter"
import type { ChatVisibility } from "@/src/entities/models/chat"

type ChatPageShellProps = {
  activeWorkspaceId?: string
  chat: {
    id: string
    isOwner: boolean
    pinned: boolean
    publicToken: string | null
    title: string
    visibility: ChatVisibility
  }
  className?: string
  currentUser: {
    avatar: string
    email: string
    initials: string
    name: string
  }
  initialMessages?: ChatUIMessage[]
  ownChats: ChatConversationEntry[]
  teamChats: ChatHistoryEntry[]
  workspaces: ChatWorkspaceSummary[]
}

/** Renders chat shell around current authenticated user's conversation. */
export function ChatPageShell({
  activeWorkspaceId,
  chat,
  className,
  currentUser,
  initialMessages,
  ownChats,
  teamChats,
  workspaces,
}: ChatPageShellProps) {
  return (
    <ChatAppShell
      activeWorkspaceId={activeWorkspaceId}
      className={className}
      currentUser={currentUser}
      initialTitle={chat.title}
      ownChats={ownChats}
      teamChats={teamChats}
      workspaces={workspaces}
    >
      <ChatPageHeader
        actions={
          chat.isOwner ? (
            <>
              <ChatShareDialog
                chatId={chat.id}
                initialPublicToken={chat.publicToken}
                initialVisibility={chat.visibility}
              />
              <ChatThreadActions chatId={chat.id} pinned={chat.pinned} />
            </>
          ) : undefined
        }
      >
        <ChatConversationTitle className="min-w-0" />
      </ChatPageHeader>
      {chat.isOwner ? (
        <ChatThread chatId={chat.id} initialMessages={initialMessages} />
      ) : (
        <ChatTranscript messages={initialMessages ?? []} title={chat.title} />
      )}
    </ChatAppShell>
  )
}
