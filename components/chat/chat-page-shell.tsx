import { ChatAppSidebar } from "@/components/chat/chat-app-sidebar"
import type { ChatHistoryEntry } from "@/components/chat/chat-history"
import type { ChatWorkspaceSummary } from "@/components/chat/chat-workspace-switcher"
import {
  ChatConversationTitle,
  ChatConversationTitleProvider,
} from "@/components/chat/chat-conversation-title"
import { ChatShareDialog } from "@/components/chat/chat-share-dialog"
import { ChatThread } from "@/components/chat/chat-thread"
import { ChatTranscript } from "@/components/chat/chat-transcript"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import type { ChatUIMessage } from "@/src/interface-adapters/presenters/chat-message.presenter"
import type { ChatVisibility } from "@/src/entities/models/chat"
import { cn } from "@/lib/utils"

type ChatPageShellProps = {
  activeWorkspaceId?: string
  chat: {
    id: string
    isOwner: boolean
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
  ownChats: ChatHistoryEntry[]
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
    <ChatConversationTitleProvider initialTitle={chat.title}>
      <SidebarProvider className={cn("isolate h-svh", className)}>
        <ChatAppSidebar
          activeWorkspaceId={activeWorkspaceId}
          currentUser={currentUser}
          ownChats={ownChats}
          teamChats={teamChats}
          workspaces={workspaces}
        />

        <SidebarInset id="main-content" className="min-w-0 overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-2 px-3">
            <SidebarTrigger aria-label="Toggle sidebar" />
            <Separator
              className="data-vertical:h-4 data-vertical:self-auto"
              orientation="vertical"
            />
            <ChatConversationTitle className="min-w-0 flex-1 pl-2" />
            {chat.isOwner && (
              <ChatShareDialog
                chatId={chat.id}
                initialPublicToken={chat.publicToken}
                initialVisibility={chat.visibility}
              />
            )}
          </header>
          {chat.isOwner ? (
            <ChatThread chatId={chat.id} initialMessages={initialMessages} />
          ) : (
            <ChatTranscript
              messages={initialMessages ?? []}
              title={chat.title}
            />
          )}
        </SidebarInset>
      </SidebarProvider>
    </ChatConversationTitleProvider>
  )
}
