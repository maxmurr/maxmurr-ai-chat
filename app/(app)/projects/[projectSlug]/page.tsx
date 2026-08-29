import type { Metadata } from "next"
import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  ProjectDetail,
  ProjectDetailSkeleton,
} from "@/features/project/components/project-detail"
import { PROJECT_SEED } from "@/features/project/components/project-data"
import { ProjectsWorkspace } from "@/features/project/components/projects-workspace"

/** Uses seed project name for browser title when route is known. */
export async function generateMetadata({
  params,
}: PageProps<"/projects/[projectSlug]">): Promise<Metadata> {
  const { projectSlug } = await params
  const project = PROJECT_SEED.find(({ slug }) => slug === projectSlug)

  return {
    title: `${project?.name ?? "Project"} – AI Chat`,
  }
}

/** Composes one browser-persisted project from resolved route slug. */
export default function ProjectBySlugPage({
  params,
}: PageProps<"/projects/[projectSlug]">) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-testid="project-detail-shell"
    >
      <ErrorBoundary title="Project did not load">
        <Suspense fallback={<ProjectDetailSkeleton />}>
          {params.then(({ projectSlug }) => (
            <ProjectsWorkspace>
              <ProjectDetail projectSlug={projectSlug} />
            </ProjectsWorkspace>
          ))}
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
