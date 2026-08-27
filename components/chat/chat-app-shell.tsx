import type { ReactNode } from "react"

import {
  ChatAppSidebar,
  type ChatAppSidebarProps,
} from "@/components/chat/chat-app-sidebar"
import { ChatConversationTitleProvider } from "@/components/chat/chat-conversation-title"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type ChatAppShellProps = Omit<ChatAppSidebarProps, "className"> & {
  children: ReactNode
  className?: string
  initialTitle: string
}

/** Shares workspace navigation and title state across authenticated app pages. */
export function ChatAppShell({
  children,
  className,
  initialTitle,
  ...sidebarProps
}: ChatAppShellProps) {
  return (
    <ChatConversationTitleProvider initialTitle={initialTitle}>
      <SidebarProvider className={cn("isolate h-svh", className)}>
        <ChatAppSidebar {...sidebarProps} />
        <SidebarInset id="main-content" className="min-w-0 overflow-hidden">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ChatConversationTitleProvider>
  )
}
