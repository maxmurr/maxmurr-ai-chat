import type { Metadata } from "next";
import { Suspense } from "react";

import { AppRouteShell } from "@/components/app-route-shell";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  ProjectDetail,
  ProjectDetailSkeleton,
} from "@/features/project/components/project-detail";
import {
  ProjectSources,
  ProjectSourcesSkeleton,
} from "@/features/project/components/project-sources";

export const metadata: Metadata = {
  title: "Project – AI Chat",
};

/** Composes one persisted Project from resolved id route. */
export default function ProjectByIdPage({
  params,
}: PageProps<"/projects/[projectId]">) {
  return (
    <AppRouteShell data-testid="project-detail-shell">
      <ErrorBoundary title="Project did not load">
        <Suspense fallback={<ProjectDetailSkeleton />}>
          {params.then(({ projectId }) => (
            <ProjectDetail
              projectId={projectId}
              projectSources={
                <ErrorBoundary title="Project Sources did not load">
                  <Suspense fallback={<ProjectSourcesSkeleton />}>
                    <ProjectSources projectId={projectId} />
                  </Suspense>
                </ErrorBoundary>
              }
            />
          ))}
        </Suspense>
      </ErrorBoundary>
    </AppRouteShell>
  );
}
