import type { Metadata } from "next"
import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ChatPageHeader } from "@/features/chat/components/chat-page-header"
import { ProjectsList } from "@/features/project/components/projects-list"
import {
  ProjectsWorkspace,
  ProjectsWorkspaceSkeleton,
} from "@/features/project/components/projects-workspace"

export const metadata: Metadata = {
  title: "Projects – AI Chat",
}

/** Renders searchable workspace project index. */
export default function ProjectsPage() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-testid="projects-shell"
    >
      <ChatPageHeader>
        <p className="text-sm font-medium" data-testid="projects-index-content">
          Projects
        </p>
      </ChatPageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ErrorBoundary title="Projects did not load">
          <Suspense fallback={<ProjectsWorkspaceSkeleton />}>
            <ProjectsWorkspace>
              <ProjectsList />
            </ProjectsWorkspace>
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}
