import type { Metadata } from "next"
import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  ProjectDetail,
  ProjectDetailSkeleton,
} from "@/features/project/components/project-detail"
import { PROJECT_SEED } from "@/features/project/components/project-data"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
    <ErrorBoundary title="Project did not load">
      <Suspense fallback={<ProjectDetailSkeleton />}>
        {params.then(({ projectSlug }) => (
          <ProjectDetail projectSlug={projectSlug} />
        ))}
      </Suspense>
    </ErrorBoundary>
  )
}
