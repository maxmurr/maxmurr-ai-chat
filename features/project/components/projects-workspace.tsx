import type { ReactNode } from "react"

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

/** Reserves project cards while workspace identity loads. */
export function ProjectsWorkspaceSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading projects"
      className="@container mx-auto w-full max-w-7xl p-4 lg:p-6"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <Skeleton className="h-11 min-w-0 max-w-xs flex-1 sm:h-8" />
          <Skeleton className="h-11 w-24 shrink-0 sm:h-8" />
        </div>
        <div className="grid gap-3 @xl:grid-cols-2 @6xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton className="h-28 w-full min-w-0" key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
