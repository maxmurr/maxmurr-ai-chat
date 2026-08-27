import { loadChatPageData } from "@/app/chat/chat-page-data"
import { ChatAppShell } from "@/components/chat/chat-app-shell"
import { ProjectsProvider } from "@/components/projects/project-state"

/** Shares authenticated chat navigation and project state across project routes. */
export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { activeWorkspaceId, currentUser, ownChats, teamChats, workspaces } =
    await loadChatPageData()

  return (
    <ProjectsProvider
      key={activeWorkspaceId}
      storageKey={`projects:${activeWorkspaceId}`}
    >
      <ChatAppShell
        activeNavigation="projects"
        activeWorkspaceId={activeWorkspaceId}
        currentUser={currentUser}
        initialTitle="Projects"
        ownChats={ownChats}
        teamChats={teamChats}
        workspaces={workspaces}
      >
        {children}
      </ChatAppShell>
    </ProjectsProvider>
  )
}
