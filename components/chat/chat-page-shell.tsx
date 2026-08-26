import { ChatAppSidebar } from "@/components/chat/chat-app-sidebar"
import {
  ChatConversationTitle,
  ChatConversationTitleProvider,
} from "@/components/chat/chat-conversation-title"
import { ChatShareDialog } from "@/components/chat/chat-share-dialog"
import { ChatThread } from "@/components/chat/chat-thread"
import { ChatThreadActions } from "@/components/chat/chat-thread-actions"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { mockChatConversationGroups } from "@/lib/mock-chat-conversations"

const currentUser = {
  name: "maxmurr",
  email: "maxmurr.m@gmail.com",
  avatar: "https://github.com/maxmurr.png",
  initials: "MM",
}

type ChatPageShellProps = {
  activeConversation?: {
    id: string
    title: string
  }
}

/** Renders shared shell for new and existing mock chat pages. */
export function ChatPageShell({ activeConversation }: ChatPageShellProps) {
  const conversationTitle = activeConversation?.title ?? "New chat"

  return (
    <ChatConversationTitleProvider
      key={activeConversation?.id ?? "new-chat"}
      initialTitle={conversationTitle}
    >
      <SidebarProvider className="isolate h-svh">
        <ChatAppSidebar
          activeConversationId={activeConversation?.id}
          conversationGroups={mockChatConversationGroups}
          currentUser={currentUser}
        />

        <SidebarInset className="min-w-0 overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-2 px-3">
            <SidebarTrigger aria-label="Toggle sidebar" />
            <Separator
              className="data-vertical:h-4 data-vertical:self-auto"
              orientation="vertical"
            />
            <ChatConversationTitle className="min-w-0 flex-1" />
            {activeConversation && (
              <div className="flex shrink-0 items-center gap-1">
                <ChatShareDialog conversationId={activeConversation.id} />
                <ChatThreadActions />
              </div>
            )}
          </header>
          <ChatThread
            key={activeConversation?.id ?? "new-chat"}
            initialConversationTitle={activeConversation?.title}
          />
        </SidebarInset>
      </SidebarProvider>
    </ChatConversationTitleProvider>
  )
}
