import { Skeleton } from "@/components/ui/skeleton";
import { ProjectSection } from "@/features/project/components/project-section";
import { ProjectSourcesSection } from "@/features/project/components/project-sources-section";
import { getProjectSourcesPageData } from "@/features/project/project-queries";

/** Loads owner-scoped Project Sources without blocking other Project details. */
export async function ProjectSources({ projectId }: { projectId: string }) {
  const sourceData = await getProjectSourcesPageData(projectId);
  const toProjectSourceItem = ({
    id,
    mediaType,
    name,
    size,
  }: (typeof sourceData.sources)[number]) => ({ id, mediaType, name, size });

  return (
    <ProjectSourcesSection
      availableFiles={sourceData.availableFiles.map(toProjectSourceItem)}
      projectId={projectId}
      sources={sourceData.sources.map(toProjectSourceItem)}
    />
  );
}

/** Reserves Project Source controls and cards while Source data loads. */
export function ProjectSourcesSkeleton() {
  return (
    <ProjectSection
      action={<Skeleton className="h-11 w-28 shrink-0 sm:h-7" />}
      aria-busy="true"
      aria-label="Loading Project Sources"
      title="Sources"
    >
      <div className="@container">
        <div className="grid gap-2 @sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton className="h-16 w-full min-w-0" key={index} />
          ))}
        </div>
      </div>
    </ProjectSection>
  );
}
