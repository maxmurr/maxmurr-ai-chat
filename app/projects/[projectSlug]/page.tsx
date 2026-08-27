import type { Metadata } from "next"

import { ProjectDetail } from "@/components/projects/project-detail"
import { PROJECT_SEED } from "@/components/projects/project-data"

type ProjectBySlugPageProps = {
  params: Promise<{ projectSlug: string }>
}

/** Uses seed project name for browser title when route is known at render time. */
export async function generateMetadata(
  props: ProjectBySlugPageProps,
): Promise<Metadata> {
  const { projectSlug } = await props.params
  const project = PROJECT_SEED.find(({ slug }) => slug === projectSlug)

  return {
    title: `${project?.name ?? "Project"} – AI Chat`,
  }
}

/** Renders one browser-persisted project by workspace-local slug. */
export default async function ProjectBySlugPage(props: ProjectBySlugPageProps) {
  const { projectSlug } = await props.params
  return <ProjectDetail projectSlug={projectSlug} />
}
