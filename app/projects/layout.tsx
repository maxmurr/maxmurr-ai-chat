import { loadChatPageData } from "@/app/chat/chat-page-data"
import { ChatAppSidebar } from "@/components/chat/chat-app-sidebar"
import { ChatConversationTitleProvider } from "@/components/chat/chat-conversation-title"
import { ProjectsProvider } from "@/components/projects/project-state"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

/** Shares authenticated chat navigation and project state across project routes. */
export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { activeWorkspaceId, currentUser, ownChats, teamChats, workspaces } =
    await loadChatPageData()

  return (
    <ChatConversationTitleProvider initialTitle="Projects">
      <ProjectsProvider
        key={activeWorkspaceId}
        storageKey={`projects:${activeWorkspaceId}`}
      >
        <SidebarProvider className="isolate h-svh">
          <ChatAppSidebar
            activeNavigation="projects"
            activeWorkspaceId={activeWorkspaceId}
            currentUser={currentUser}
            ownChats={ownChats}
            teamChats={teamChats}
            workspaces={workspaces}
          />
          <SidebarInset id="main-content" className="min-w-0 overflow-hidden">
            {children}
          </SidebarInset>
        </SidebarProvider>
      </ProjectsProvider>
    </ChatConversationTitleProvider>
  )
}
