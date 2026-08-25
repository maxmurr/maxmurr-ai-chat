import { ChatAppSidebar } from "@/components/chat/chat-app-sidebar"
import {
  ChatConversationTitle,
  ChatConversationTitleProvider,
} from "@/components/chat/chat-conversation-title"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const currentUser = {
  name: "maxmurr",
  email: "maxmurr.m@gmail.com",
  avatar: "https://github.com/maxmurr.png",
  initials: "MM",
}

const conversationGroups = [
  { label: "Pinned", conversations: ["Checkout 500s"] },
  {
    label: "Today",
    conversations: [
      "Review our pricing page",
      "Summarise this week’s incidents",
      "Billing: build or buy",
      "New onboarding flow",
    ],
  },
]

const initialConversationTitle = "Billing: build or buy"

export default function ChatPage() {
  return (
    <ChatConversationTitleProvider initialTitle={initialConversationTitle}>
      <SidebarProvider className="isolate h-svh">
        <ChatAppSidebar
          activeConversation={initialConversationTitle}
          conversationGroups={conversationGroups}
          currentUser={currentUser}
        />

        <SidebarInset className="min-w-0 overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-2 px-3">
            <SidebarTrigger aria-label="Toggle sidebar" />
            <Separator
              className="data-vertical:h-4 data-vertical:self-auto"
              orientation="vertical"
            />
            <ChatConversationTitle />
          </header>
          <div className="min-h-0 flex-1" />
        </SidebarInset>
      </SidebarProvider>
    </ChatConversationTitleProvider>
  )
}
