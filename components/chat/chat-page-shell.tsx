import { ChatAppSidebar } from "@/components/chat/chat-app-sidebar"
import type { ChatWorkspaceSummary } from "@/components/chat/chat-workspace-switcher"
import {
  ChatConversationTitle,
  ChatConversationTitleProvider,
} from "@/components/chat/chat-conversation-title"
import { ChatThread } from "@/components/chat/chat-thread"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type ChatPageShellProps = {
  activeWorkspaceId?: string
  className?: string
  currentUser: {
    avatar: string
    email: string
    initials: string
    name: string
  }
  workspaces: ChatWorkspaceSummary[]
}

/** Renders chat shell around current authenticated user's conversation. */
export function ChatPageShell({
  activeWorkspaceId,
  className,
  currentUser,
  workspaces,
}: ChatPageShellProps) {
  return (
    <ChatConversationTitleProvider initialTitle="New chat">
      <SidebarProvider className={cn("isolate h-svh", className)}>
        <ChatAppSidebar
          activeWorkspaceId={activeWorkspaceId}
          currentUser={currentUser}
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
          </header>
          <ChatThread />
        </SidebarInset>
      </SidebarProvider>
    </ChatConversationTitleProvider>
  )
}
