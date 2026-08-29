"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FolderXIcon } from "lucide-react"

import { ProjectChatComposer } from "@/features/project/components/project-chat-composer"
import { ProjectChatsSection } from "@/features/project/components/project-chats-section"
import { ProjectActions } from "@/features/project/components/project-actions"
import { ProjectDetailHeader } from "@/features/project/components/project-detail-header"
import { ProjectInstructionsSection } from "@/features/project/components/project-instructions-section"
import { ProjectSourcesSection } from "@/features/project/components/project-sources-section"
import { useProjects } from "@/features/project/components/project-state"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function ProjectDetailNotFound({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <ProjectDetailHeader />
      <section
        className="flex min-h-0 flex-1 items-center justify-center p-4"
        id="project-not-found"
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderXIcon />
            </EmptyMedia>
            <EmptyTitle>Project not found</EmptyTitle>
            <EmptyDescription>
              It may have been deleted, or the link belongs to another
              workspace.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              className="h-11 sm:h-8"
              nativeButton={false}
              render={<Link href="/projects" />}
            >
              Back to projects
            </Button>
          </EmptyContent>
        </Empty>
      </section>
    </div>
  )
}

/** Renders one project workspace with instructions, sources, and chats. */
export function ProjectDetail({
  className,
  projectSlug,
}: {
  className?: string
  projectSlug: string
}) {
  const router = useRouter()
  const { getProject, isReady } = useProjects()
  const project = getProject(projectSlug)

  if (!project) {
    return isReady ? (
      <ProjectDetailNotFound className={className} />
    ) : (
      <ProjectDetailSkeleton className={className} />
    )
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
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
  )
}

/** Reserves project detail structure while route and browser state load. */
export function ProjectDetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <ProjectDetailHeader projectName="Loading…" />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  )
}
