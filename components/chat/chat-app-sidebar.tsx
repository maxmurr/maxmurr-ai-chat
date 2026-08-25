import Link from "next/link"
import {
  FolderIcon,
  LibraryBigIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"

import {
  ChatConversationList,
  type ChatConversationGroup,
} from "@/components/chat/chat-conversation-list"
import { ChatUserMenu } from "@/components/chat/chat-user-menu"
import { ChatWorkspaceSwitcher } from "@/components/chat/chat-workspace-switcher"
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const primaryNavigation = [
  { label: "New chat", href: "/chat", icon: PlusIcon },
  { label: "Search", href: "#search", icon: SearchIcon },
  { label: "Projects", href: "#projects", icon: FolderIcon },
  { label: "Library", href: "#library", icon: LibraryBigIcon },
]

type ChatAppSidebarProps = {
  activeConversationId?: string
  className?: string
  conversationGroups: ReadonlyArray<ChatConversationGroup>
  currentUser: {
    avatar: string
    email: string
    initials: string
    name: string
  }
}

function ChatPrimaryNavigation({ className }: { className?: string }) {
  return (
    <SidebarMenu className={cn(className)}>
      {primaryNavigation.map((item) => (
        <SidebarMenuItem
          key={item.label}
          id={item.href.startsWith("#") ? item.href.slice(1) : undefined}
        >
          <SidebarMenuButton
            render={<Link href={item.href} />}
            tooltip={item.label}
          >
            <item.icon />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

/** Composes server-rendered chat navigation around focused client controls. */
export function ChatAppSidebar({
  activeConversationId,
  className,
  conversationGroups,
  currentUser,
}: ChatAppSidebarProps) {
  return (
    <Sidebar className={cn(className)} collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <ChatWorkspaceSwitcher />
        </SidebarMenu>
        <ChatPrimaryNavigation />
      </SidebarHeader>

      <ChatConversationList
        activeConversationId={activeConversationId}
        conversationGroups={conversationGroups}
      />

      <SidebarFooter>
        <SidebarMenu>
          <ChatUserMenu user={currentUser} />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
