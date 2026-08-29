"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderIcon, PlusIcon, SearchIcon, SearchXIcon } from "lucide-react";

import { AppPageContainer } from "@/components/app-page-container";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { NewProjectDialog } from "@/features/project/components/new-project-dialog";
import { ProjectActions } from "@/features/project/components/project-actions";
import { cn } from "@/lib/utils";
import type { Project } from "@/src/entities/models/project";

const projectDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Renders searchable persisted Project cards and creation dialog. */
export function ProjectsListBrowser({
  className,
  projects,
}: {
  className?: string;
  projects: Project[];
}) {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const matchingProjects = projects.filter(
    ({ description, name }) =>
      name.toLowerCase().includes(normalizedQuery) ||
      description?.toLowerCase().includes(normalizedQuery)
  );

  return (
    <AppPageContainer
      className={cn("mx-auto", className)}
      data-testid="projects-list-content"
    >
      {projects.length === 0 ? (
        <Empty className="min-h-64">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderIcon />
            </EmptyMedia>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>
              Projects keep related chats together with shared instructions and
              files.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              className="h-11 sm:h-8"
              type="button"
              onClick={() => setIsNewProjectOpen(true)}
            >
              <PlusIcon data-icon="inline-start" />
              New project
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <section
          aria-label="Projects"
          className="flex flex-col gap-6"
          id="project-list"
        >
          <div className="flex min-w-0 items-center justify-between gap-2">
            <InputGroup className="h-11 max-w-xs min-w-0 flex-1 sm:h-8">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search projects"
                autoComplete="off"
                name="project-search"
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Search projects…"
                spellCheck={false}
                type="search"
                value={query}
              />
            </InputGroup>
            <Button
              className="h-11 shrink-0 sm:h-8"
              onClick={() => setIsNewProjectOpen(true)}
              type="button"
            >
              New project
            </Button>
          </div>

          {matchingProjects.length === 0 ? (
            <Empty className="min-h-56">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchXIcon />
                </EmptyMedia>
                <EmptyTitle>No matches</EmptyTitle>
                <EmptyDescription>
                  No project named “{query.trim()}”.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className="grid gap-3 @xl:grid-cols-2 @6xl:grid-cols-3">
              {matchingProjects.map((project) => (
                <Item
                  className="relative items-start hover:bg-muted has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50"
                  key={project.id}
                  role="listitem"
                  variant="outline"
                >
                  <ItemContent>
                    <ItemTitle>
                      <Link
                        className="outline-none after:absolute after:inset-0"
                        href={`/projects/${project.id}`}
                      >
                        {project.name}
                      </Link>
                    </ItemTitle>
                    {project.description && (
                      <ItemDescription>{project.description}</ItemDescription>
                    )}
                    <ItemDescription className="pt-1">
                      <time dateTime={project.updatedAt.toISOString()}>
                        {projectDateFormatter.format(project.updatedAt)}
                      </time>
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="relative self-start">
                    <ProjectActions project={project} />
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </section>
      )}

      <NewProjectDialog
        onOpenChange={setIsNewProjectOpen}
        open={isNewProjectOpen}
      />
    </AppPageContainer>
  );
}
