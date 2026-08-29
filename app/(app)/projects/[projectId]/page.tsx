import type { Metadata } from "next";
import { Suspense } from "react";

import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  ProjectDetail,
  ProjectDetailSkeleton,
} from "@/features/project/components/project-detail";

export const metadata: Metadata = {
  title: "Project – AI Chat",
};

/** Composes one persisted Project from resolved id route. */
export default function ProjectByIdPage({
  params,
}: PageProps<"/projects/[projectId]">) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-testid="project-detail-shell"
    >
      <ErrorBoundary title="Project did not load">
        <Suspense fallback={<ProjectDetailSkeleton />}>
          {params.then(({ projectId }) => (
            <ProjectDetail projectId={projectId} />
          ))}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
