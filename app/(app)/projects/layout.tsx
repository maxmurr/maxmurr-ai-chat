import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  ProjectsWorkspace,
  ProjectsWorkspaceSkeleton,
} from "@/features/project/components/projects-workspace"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
