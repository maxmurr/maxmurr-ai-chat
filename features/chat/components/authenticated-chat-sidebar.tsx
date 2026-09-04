import { Suspense, type ReactNode } from "react";

import { AppSidebarFrame } from "@/components/app-sidebar-frame";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ChatAppSidebar } from "@/features/chat/components/chat-app-sidebar";
import { getChatSidebarEntries } from "@/features/chat/chat-queries";
import { getProjectsPageData } from "@/features/project/project-queries";
import {
  getAuthenticatedWorkspaceContext,
  getCurrentWorkspaceAdminStatus,
} from "@/features/workspace/workspace-queries";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

/** Loads authenticated workspace navigation and sidebar chat history. */
export async function AuthenticatedChatSidebar() {
  const workspace = await getAuthenticatedWorkspaceContext();
  const [chats, isWorkspaceAdmin, projects] = await Promise.all([
    getChatSidebarEntries(workspace.activeWorkspaceId, workspace.userId),
    getCurrentWorkspaceAdminStatus(
      workspace.requestHeaders,
      workspace.activeWorkspaceId
    ),
    getProjectsPageData(),
  ]);

  return (
    <ChatAppSidebar
      activeWorkspaceId={workspace.activeWorkspaceId}
      currentUser={workspace.currentUser}
      isWorkspaceAdmin={isWorkspaceAdmin}
      ownChats={chats.ownChats}
      projects={projects.map(({ description, id, name, pinned }) => ({
        description,
        id,
        name,
        pinned,
      }))}
      teamChats={chats.teamChats}
      workspaces={workspace.workspaces}
    />
  );
}

/** Frames content with authenticated Chat sidebar and loading states. */
export function AuthenticatedChatAppFrame({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AppSidebarFrame
      sidebar={
        <ErrorBoundary title="Navigation did not load" variant="sidebar">
          <Suspense fallback={<AuthenticatedChatSidebarSkeleton />}>
            <AuthenticatedChatSidebar />
          </Suspense>
        </ErrorBoundary>
      }
    >
      {children}
    </AppSidebarFrame>
  );
}

/** Reserves authenticated app sidebar while workspace data loads. */
export function AuthenticatedChatSidebarSkeleton() {
  return (
    <Sidebar
      aria-busy="true"
      aria-label="Loading navigation"
      collapsible="icon"
      variant="inset"
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
  );
}
