"use client"

import Link from "next/link"
import { MessageSquareIcon, XIcon } from "lucide-react"

import type { ProjectRecord } from "@/components/projects/project-data"
import { ProjectSectionHeader } from "@/components/projects/project-section-header"
import { useProjects } from "@/components/projects/project-state"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { TouchTarget } from "@/components/ui/touch-target"
import { cn } from "@/lib/utils"

type ProjectChatsSectionProps = {
  className?: string
  project: ProjectRecord
}

/** Renders chats assigned to one project with removal actions. */
export function ProjectChatsSection({
  className,
  project,
}: ProjectChatsSectionProps) {
  const { updateProject } = useProjects()

  return (
    <section
      className={cn("flex flex-col gap-3", className)}
      id="project-chats"
    >
      <ProjectSectionHeader title="Chats" />
      {project.chats.length > 0 ? (
        <ItemGroup className="gap-2">
          {project.chats.map((chat) => (
            <Item key={chat.id} role="listitem" variant="outline">
              <ItemMedia variant="icon">
                <MessageSquareIcon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  <Link className="hover:underline" href={chat.href}>
                    {chat.title}
                  </Link>
                </ItemTitle>
                <ItemDescription>{chat.updatedLabel}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  aria-label={`Remove ${chat.title} from project`}
                  className="relative opacity-0 group-focus-within/item:opacity-100 group-hover/item:opacity-100 pointer-coarse:opacity-100"
                  onClick={() =>
                    updateProject(project.slug, {
                      chats: project.chats.filter(({ id }) => id !== chat.id),
                    })
                  }
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <XIcon />
                  <TouchTarget />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      ) : (
        <p className="text-pretty text-base text-muted-foreground sm:text-sm">
          No chats in this project yet. Add one from any chat menu.
        </p>
      )}
    </section>
  )
}
