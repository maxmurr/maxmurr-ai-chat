import { ChatAppSidebar } from "@/features/chat/components/chat-app-sidebar"
import { getChatSidebarEntries } from "@/features/chat/chat-queries"
import { getAuthenticatedWorkspaceContext } from "@/features/workspace/workspace-queries"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

/** Loads authenticated workspace navigation and sidebar chat history. */
export async function AuthenticatedChatSidebar() {
  const workspace = await getAuthenticatedWorkspaceContext()
  const chats = await getChatSidebarEntries(
    workspace.activeWorkspaceId,
    workspace.userId
  )

  return (
    <ChatAppSidebar
      activeWorkspaceId={workspace.activeWorkspaceId}
      currentUser={workspace.currentUser}
      ownChats={chats.ownChats}
      teamChats={chats.teamChats}
      workspaces={workspace.workspaces}
    />
  )
}

/** Reserves authenticated app sidebar while workspace data loads. */
export function AuthenticatedChatSidebarSkeleton() {
  return (
    <Sidebar
      aria-busy="true"
      aria-label="Loading navigation"
      collapsible="icon"
      variant="floating"
    >
      <SidebarHeader className="gap-3 p-2">
        <Skeleton className="h-14 w-full lg:h-12" />
        <div className="flex min-w-0 flex-col gap-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="h-12 w-full lg:h-8" key={index} />
          ))}
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-2 p-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-12 w-full lg:h-8" key={index} />
        ))}
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Skeleton className="h-14 w-full lg:h-12" />
      </SidebarFooter>
    </Sidebar>
  )
}
