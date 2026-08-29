import { AppPageContainer } from "@/components/app-page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectsListBrowser } from "@/features/project/components/projects-list-browser";
import { getProjectsPageData } from "@/features/project/project-queries";

/** Loads owner-scoped persisted Projects for searchable Project list. */
export async function ProjectsList() {
  return <ProjectsListBrowser projects={await getProjectsPageData()} />;
}

/** Reserves Project cards while authenticated Project listing loads. */
export function ProjectsListSkeleton() {
  return (
    <AppPageContainer
      aria-busy="true"
      aria-label="Loading projects"
      className="mx-auto"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <Skeleton className="h-11 max-w-xs min-w-0 flex-1 sm:h-8" />
          <Skeleton className="h-11 w-24 shrink-0 sm:h-8" />
        </div>
        <div className="grid gap-3 @xl:grid-cols-2 @6xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton className="h-28 w-full min-w-0" key={index} />
          ))}
        </div>
      </div>
    </AppPageContainer>
  );
}
