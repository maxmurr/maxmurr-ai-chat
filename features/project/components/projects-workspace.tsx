import type { ReactNode } from "react"

import { ChatPageHeader } from "@/features/chat/components/chat-page-header"
import { ProjectsProvider } from "@/features/project/components/project-state"
import { getAuthenticatedWorkspaceContext } from "@/features/workspace/workspace-queries"
import { Skeleton } from "@/components/ui/skeleton"

/** Loads workspace identity before mounting workspace-scoped project state. */
export async function ProjectsWorkspace({ children }: { children: ReactNode }) {
  const { activeWorkspaceId } = await getAuthenticatedWorkspaceContext()

  return (
    <ProjectsProvider
      key={activeWorkspaceId}
      storageKey={`projects:${activeWorkspaceId}`}
    >
      {children}
    </ProjectsProvider>
  )
}

/** Reserves project page header and content while workspace identity loads. */
export function ProjectsWorkspaceSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatPageHeader>
        <Skeleton className="h-4 w-24" />
      </ChatPageHeader>
      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton className="h-28 w-full" key={index} />
        ))}
      </div>
    </div>
  )
}
