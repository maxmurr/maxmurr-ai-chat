import Link from "next/link"
import {
  FolderIcon,
  LibraryBigIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"

import type { ChatConversationEntry } from "@/components/chat/chat-conversation-item"
import {
  ChatHistory,
  type ChatHistoryEntry,
} from "@/components/chat/chat-history"
import { ChatUserMenu } from "@/components/chat/chat-user-menu"
import {
  ChatWorkspaceSwitcher,
  type ChatWorkspaceSummary,
} from "@/components/chat/chat-workspace-switcher"
import {
  Sidebar,
  SidebarContent,
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
  { label: "Projects", href: "/projects", icon: FolderIcon },
  { label: "Library", href: "/library", icon: LibraryBigIcon },
]

/** Data needed to render workspace navigation and chat history. */
export type ChatAppSidebarProps = {
  activeNavigation?: "library" | "projects"
  activeWorkspaceId?: string
  className?: string
  currentUser: {
    avatar: string
    email: string
    initials: string
    name: string
  }
  ownChats: ChatConversationEntry[]
  teamChats: ChatHistoryEntry[]
  workspaces: ChatWorkspaceSummary[]
}

function ChatPrimaryNavigation({
  activeNavigation,
  className,
}: {
  activeNavigation?: "library" | "projects"
  className?: string
}) {
  return (
    <SidebarMenu className={cn(className)}>
      {primaryNavigation.map((item) => (
        <SidebarMenuItem
          key={item.label}
          id={item.href.startsWith("#") ? item.href.slice(1) : undefined}
        >
          <SidebarMenuButton
            isActive={
              activeNavigation !== undefined &&
              item.href === `/${activeNavigation}`
            }
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
  activeNavigation,
  activeWorkspaceId,
  className,
  currentUser,
  ownChats,
  teamChats,
  workspaces,
}: ChatAppSidebarProps) {
  return (
    <Sidebar className={cn(className)} collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <ChatWorkspaceSwitcher
            activeWorkspaceId={activeWorkspaceId}
            initialWorkspaces={workspaces}
          />
        </SidebarMenu>
        <ChatPrimaryNavigation activeNavigation={activeNavigation} />
      </SidebarHeader>

      <SidebarContent>
        <ChatHistory ownChats={ownChats} teamChats={teamChats} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <ChatUserMenu user={currentUser} />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
