import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  ProjectsWorkspace,
  ProjectsWorkspaceSkeleton,
} from "@/features/project/components/projects-workspace"

/** Provides workspace-scoped browser project state. */
export default function ProjectsLayout({
  children,
}: LayoutProps<"/projects">) {
  return (
    <ErrorBoundary title="Projects did not load">
      <Suspense fallback={<ProjectsWorkspaceSkeleton />}>
        <ProjectsWorkspace>{children}</ProjectsWorkspace>
      </Suspense>
    </ErrorBoundary>
  )
}
