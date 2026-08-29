"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderXIcon } from "lucide-react";

import { ProjectChatComposer } from "@/features/project/components/project-chat-composer";
import { ProjectChatsSection } from "@/features/project/components/project-chats-section";
import { ProjectActions } from "@/features/project/components/project-actions";
import { ProjectDetailHeader } from "@/features/project/components/project-detail-header";
import { ProjectInstructionsSection } from "@/features/project/components/project-instructions-section";
import { ProjectSourcesSection } from "@/features/project/components/project-sources-section";
import { useProjects } from "@/features/project/components/project-state";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function ProjectDetailNotFound({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <ProjectDetailHeader />
      <ErrorState
        className="p-4"
        description="It may have been deleted, or the link belongs to another workspace."
        icon={<FolderXIcon aria-hidden="true" className="size-5" />}
        id="project-not-found"
        title="Project not found"
      >
        <Button
          className="h-11 sm:h-8"
          nativeButton={false}
          render={<Link href="/projects" />}
        >
          Back to projects
        </Button>
      </ErrorState>
    </div>
  );
}

/** Renders one project workspace with instructions, sources, and chats. */
export function ProjectDetail({
  className,
  projectSlug,
}: {
  className?: string;
  projectSlug: string;
}) {
  const router = useRouter();
  const { getProject, isReady } = useProjects();
  const project = getProject(projectSlug);

  if (!project) {
    return isReady ? (
      <ProjectDetailNotFound className={className} />
    ) : (
      <ProjectDetailSkeleton className={className} />
    );
  }

  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col", className)}
      data-testid="project-detail-content"
    >
      <ProjectDetailHeader
        actions={
          <ProjectActions
            onDeleted={() => router.push("/projects")}
            project={project}
          />
        }
        projectName={project.name}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 pb-12">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-xl font-medium text-balance">
              {project.name}
            </h1>
            {project.description && (
              <p className="max-w-[70ch] text-base text-pretty text-muted-foreground sm:text-sm">
                {project.description}
              </p>
            )}
          </div>

          <ProjectChatComposer />
          <ProjectInstructionsSection project={project} />
          <ProjectSourcesSection project={project} />
          <ProjectChatsSection project={project} />
        </div>
      </div>
    </div>
  );
}

/** Reserves project detail structure while route and browser state load. */
export function ProjectDetailSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading project"
      className={cn("flex min-h-0 min-w-0 flex-1 flex-col", className)}
    >
      <ProjectDetailHeader projectName="Loading…" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 pb-12">
          <div className="flex min-w-0 flex-col gap-2">
            <Skeleton className="h-7 w-2/3 max-w-44" />
            <Skeleton className="h-5 w-full max-w-xl sm:h-4" />
          </div>

          <Skeleton className="h-20 w-full" />

          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <Skeleton className="h-5 w-24 sm:h-4" />
              <Skeleton className="h-11 w-16 shrink-0 sm:h-7" />
            </div>
            <Skeleton className="h-5 w-full sm:h-4" />
            <Skeleton className="h-5 w-4/5 sm:h-4" />
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <Skeleton className="h-5 w-20 sm:h-4" />
              <Skeleton className="h-11 w-28 shrink-0 sm:h-7" />
            </div>
            <div className="@container">
              <div className="grid gap-2 @sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton className="h-16 w-full min-w-0" key={index} />
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <Skeleton className="h-5 w-16 sm:h-4" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
