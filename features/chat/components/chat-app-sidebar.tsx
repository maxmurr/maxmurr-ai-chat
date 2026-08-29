import type { ChatConversationEntry } from "@/features/chat/components/chat-conversation-item";
import {
  ChatHistory,
  type ChatHistoryEntry,
} from "@/features/chat/components/chat-history";
import { ChatPrimaryNavigation } from "@/features/chat/components/chat-primary-navigation";
import { ChatUserMenu } from "@/features/chat/components/chat-user-menu";
import {
  ChatWorkspaceSwitcher,
  type ChatWorkspaceSummary,
} from "@/features/chat/components/chat-workspace-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/** Data needed to render workspace navigation and chat history. */
export type ChatAppSidebarProps = {
  activeWorkspaceId: string;
  className?: string;
  currentUser: {
    avatar: string;
    email: string;
    initials: string;
    name: string;
  };
  ownChats: ChatConversationEntry[];
  projects: { id: string; name: string }[];
  teamChats: ChatHistoryEntry[];
  workspaces: ChatWorkspaceSummary[];
};

/** Composes server-rendered app navigation around focused client controls. */
export function ChatAppSidebar({
  activeWorkspaceId,
  className,
  currentUser,
  ownChats,
  projects,
  teamChats,
  workspaces,
}: ChatAppSidebarProps) {
  return (
    <Sidebar className={cn(className)} collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <ChatWorkspaceSwitcher
            activeWorkspaceId={activeWorkspaceId}
            workspaces={workspaces}
          />
        </SidebarMenu>
        <ChatPrimaryNavigation chats={[...ownChats, ...teamChats]} />
      </SidebarHeader>

      <SidebarContent>
        <ChatHistory
          ownChats={ownChats}
          projects={projects}
          teamChats={teamChats}
        />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <ChatUserMenu user={currentUser} />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
