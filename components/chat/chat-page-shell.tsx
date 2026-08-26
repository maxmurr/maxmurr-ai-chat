import { ChatAppSidebar } from "@/components/chat/chat-app-sidebar"
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

const currentUser = {
  name: "maxmurr",
  email: "maxmurr.m@gmail.com",
  avatar: "https://github.com/maxmurr.png",
  initials: "MM",
}

/** Renders chat shell around current live conversation. */
export function ChatPageShell({ className }: { className?: string }) {
  return (
    <ChatConversationTitleProvider initialTitle="New chat">
      <SidebarProvider className={cn("isolate h-svh", className)}>
        <ChatAppSidebar currentUser={currentUser} />

        <SidebarInset className="min-w-0 overflow-hidden">
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
