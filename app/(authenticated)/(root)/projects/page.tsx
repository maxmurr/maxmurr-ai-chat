import type { Metadata } from "next";
import { Suspense } from "react";

import { AppRouteShell } from "@/components/app-route-shell";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AppPageHeader } from "@/components/app-page-header";
import {
  ProjectsList,
  ProjectsListSkeleton,
} from "@/features/project/components/projects-list";

export const metadata: Metadata = {
  title: "Projects – AI Chat",
};

/** Renders searchable workspace project index. */
export default function ProjectsPage() {
  return (
    <AppRouteShell data-testid="projects-shell">
      <AppPageHeader>
        <p className="text-sm font-medium" data-testid="projects-index-content">
          Projects
        </p>
      </AppPageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ErrorBoundary title="Projects did not load">
          <Suspense fallback={<ProjectsListSkeleton />}>
            <ProjectsList />
          </Suspense>
        </ErrorBoundary>
      </div>
    </AppRouteShell>
  );
}
