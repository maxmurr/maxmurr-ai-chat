"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

import {
  createUniqueProjectSlug,
  PROJECT_SEED,
  type ProjectChatSummary,
  type ProjectRecord,
  type ProjectSource,
} from "@/features/project/components/project-data"

type ProjectUpdate = Partial<
  Pick<
    ProjectRecord,
    "chats" | "description" | "instructions" | "name" | "sources"
  >
>

type ProjectState = {
  createProject: (name: string, description?: string) => ProjectRecord
  deleteProject: (projectSlug: string) => void
  getProject: (projectSlug: string) => ProjectRecord | undefined
  isReady: boolean
  projects: ProjectRecord[]
  updateProject: (projectSlug: string, update: ProjectUpdate) => void
}

const ProjectsContext = createContext<ProjectState | null>(null)

function normalizeProjectSource(value: unknown): ProjectSource | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const source = value as Partial<ProjectSource>
  return typeof source.filename === "string" &&
    typeof source.mediaType === "string"
    ? { filename: source.filename, mediaType: source.mediaType }
    : null
}

function normalizeProjectChat(value: unknown): ProjectChatSummary | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const chat = value as Partial<ProjectChatSummary>
  return typeof chat.href === "string" &&
    typeof chat.id === "string" &&
    typeof chat.title === "string" &&
    typeof chat.updatedLabel === "string"
    ? {
        href: chat.href,
        id: chat.id,
        title: chat.title,
        updatedLabel: chat.updatedLabel,
      }
    : null
}

function normalizeProjectRecord(value: unknown): ProjectRecord | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const project = value as Partial<ProjectRecord>

  if (
    typeof project.name !== "string" ||
    typeof project.slug !== "string" ||
    typeof project.updatedAt !== "string"
  ) {
    return null
  }

  return {
    chats: Array.isArray(project.chats)
      ? project.chats.flatMap((chat) => normalizeProjectChat(chat) ?? [])
      : [],
    description:
      typeof project.description === "string" ? project.description : undefined,
    instructions:
      typeof project.instructions === "string"
        ? project.instructions
        : undefined,
    name: project.name,
    slug: project.slug,
    sources: Array.isArray(project.sources)
      ? project.sources.flatMap(
          (source) => normalizeProjectSource(source) ?? [],
        )
      : [],
    updatedAt: project.updatedAt,
  }
}

function readStoredProjects(storageKey: string) {
  try {
    const storedProjects = window.localStorage.getItem(storageKey)

    if (storedProjects === null) {
      return null
    }

    const parsedProjects: unknown = JSON.parse(storedProjects)
    return Array.isArray(parsedProjects)
      ? parsedProjects.flatMap(
          (project) => normalizeProjectRecord(project) ?? [],
        )
      : null
  } catch {
    return null
  }
}

/** Provides workspace-scoped browser project state to project routes. */
export function ProjectsProvider({
  children,
  storageKey,
}: {
  children: React.ReactNode
  storageKey: string
}) {
  const [isReady, setIsReady] = useState(false)
  const [projects, setProjects] = useState<ProjectRecord[]>(() => [
    ...PROJECT_SEED,
  ])

  // ponytail: browser persistence covers reference UI; replace with project
  // tables when projects must sync across devices or workspace members.
  useEffect(() => {
    let isCurrent = true

    queueMicrotask(() => {
      if (!isCurrent) {
        return
      }

      const storedProjects = readStoredProjects(storageKey)

      if (storedProjects !== null) {
        setProjects(storedProjects)
      }

      setIsReady(true)
    })

    return () => {
      isCurrent = false
    }
  }, [storageKey])

  useEffect(() => {
    if (!isReady) {
      return
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(projects))
    } catch {
      // In-memory state still works when storage is unavailable.
    }
  }, [isReady, projects, storageKey])

  const projectState = useMemo<ProjectState>(
    () => ({
      createProject(name, description) {
        const project: ProjectRecord = {
          chats: [],
          description,
          name,
          slug: createUniqueProjectSlug(
            name,
            projects.map(({ slug }) => slug),
          ),
          sources: [],
          updatedAt: new Date().toISOString(),
        }
        setProjects((currentProjects) => [project, ...currentProjects])
        return project
      },
      deleteProject(projectSlug) {
        setProjects((currentProjects) =>
          currentProjects.filter(({ slug }) => slug !== projectSlug),
        )
      },
      getProject(projectSlug) {
        return projects.find(({ slug }) => slug === projectSlug)
      },
      isReady,
      projects,
      updateProject(projectSlug, update) {
        setProjects((currentProjects) =>
          currentProjects.map((project) =>
            project.slug === projectSlug
              ? {
                  ...project,
                  ...update,
                  updatedAt: new Date().toISOString(),
                }
              : project,
          ),
        )
      },
    }),
    [isReady, projects],
  )

  return (
    <ProjectsContext.Provider value={projectState}>
      {children}
    </ProjectsContext.Provider>
  )
}

/** Returns project state owned by nearest ProjectsProvider. */
export function useProjects() {
  const projects = useContext(ProjectsContext)

  if (!projects) {
    throw new Error(
      "Projects context missing: wrap project UI in ProjectsProvider.",
    )
  }

  return projects
}
