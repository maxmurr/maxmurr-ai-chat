import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ChatPageHeader } from "@/features/chat/components/chat-page-header";
import { ProjectActions } from "@/features/project/components/project-actions";
import { ProjectChatComposer } from "@/features/project/components/project-chat-composer";
import { ProjectChatsSection } from "@/features/project/components/project-chats-section";
import { ProjectDetailHeader } from "@/features/project/components/project-detail-header";
import { ProjectInstructionsSection } from "@/features/project/components/project-instructions-section";
import { getProjectPageData } from "@/features/project/project-queries";
import { cn } from "@/lib/utils";

/** Loads and renders one persisted owner-scoped Project by id. */
export async function ProjectDetail({
  className,
  projectId,
  projectSources,
}: {
  className?: string;
  projectId: string;
  projectSources: ReactNode;
}) {
  const project = await getProjectPageData(projectId);

  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col", className)}
      data-testid="project-detail-content"
    >
      <ProjectDetailHeader
        actions={
          <ProjectActions
            deleteRedirect="/projects"
            project={{
              description: project.description,
              id: project.id,
              name: project.name,
              pinned: project.pinned,
            }}
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

          <ProjectChatComposer projectId={project.id} />
          <ProjectInstructionsSection
            project={{ id: project.id, instructions: project.instructions }}
          />
          {projectSources}
          <ProjectChatsSection chats={project.chats} />
        </div>
      </div>
    </div>
  );
}

/** Reserves Project detail structure while authenticated Project loads. */
export function ProjectDetailSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading project"
      className={cn("flex min-h-0 min-w-0 flex-1 flex-col", className)}
    >
      <ChatPageHeader>
        <Skeleton className="h-5 w-28 max-w-full sm:h-4" />
      </ChatPageHeader>
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
