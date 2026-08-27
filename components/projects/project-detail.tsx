"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileTextIcon,
  FolderXIcon,
  LibraryBigIcon,
  MessageSquareIcon,
  PencilIcon,
  PlusIcon,
  UploadIcon,
  XIcon,
} from "lucide-react"

import { ChatComposerToolbar } from "@/components/chat/chat-composer-toolbar"
import { LIBRARY_ITEMS } from "@/components/library/library-data"
import { ProjectActions } from "@/components/projects/project-controls"
import {
  formatProjectSourceType,
  type ProjectRecord,
  type ProjectSource,
} from "@/components/projects/project-data"
import { useProjects } from "@/components/projects/project-state"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"

function ProjectDetailHeader({
  actions,
  projectName,
}: {
  actions?: React.ReactNode
  projectName?: string
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
        <SidebarTrigger aria-label="Toggle sidebar" />
        <Separator
          className="data-vertical:h-4 data-vertical:self-auto"
          orientation="vertical"
        />
        <Breadcrumb className="min-w-0 pl-2">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/projects" />}>
                Projects
              </BreadcrumbLink>
            </BreadcrumbItem>
            {projectName && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="truncate">
                    {projectName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {actions && <div className="shrink-0 px-3">{actions}</div>}
    </header>
  )
}

function ProjectSectionHeader({
  action,
  title,
}: {
  action?: React.ReactNode
  title: string
}) {
  return (
    <div className="flex items-end justify-between gap-2">
      <h2 className="text-base font-medium sm:text-sm">{title}</h2>
      {action}
    </div>
  )
}

function ProjectInstructionsDialog({
  onOpenChange,
  open,
  project,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
  project: ProjectRecord
}) {
  const { updateProject } = useProjects()

  function saveProjectInstructions(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const instructions = String(
      new FormData(event.currentTarget).get("instructions") ?? "",
    ).trim()
    updateProject(project.slug, { instructions: instructions || undefined })
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <form
          className="contents"
          key={project.instructions}
          onSubmit={saveProjectInstructions}
        >
          <DialogHeader>
            <DialogTitle>Project instructions</DialogTitle>
            <DialogDescription>
              These instructions carry into every chat in this project.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor={`${project.slug}-instructions`}>
              Instructions
            </FieldLabel>
            <Textarea
              className="min-h-40"
              defaultValue={project.instructions}
              id={`${project.slug}-instructions`}
              name="instructions"
              placeholder="Tone, house rules, and things the model keeps getting wrong…"
            />
          </Field>
          <DialogFooter>
            <Button className="h-11 sm:h-8" type="submit">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function getLibraryProjectSourceMediaType(filename: string) {
  if (filename.endsWith(".pdf")) {
    return "application/pdf"
  }

  if (filename.endsWith(".csv")) {
    return "text/csv"
  }

  return "application/octet-stream"
}

function ProjectLibrarySourceDialog({
  existingSources,
  onAdd,
  onOpenChange,
  open,
}: {
  existingSources: ProjectSource[]
  onAdd: (source: ProjectSource) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const existingFilenames = new Set(
    existingSources.map(({ filename }) => filename),
  )
  const availableFiles = LIBRARY_ITEMS.filter(
    (item) => item.kind === "file" && !existingFilenames.has(item.name),
  )

  if (!open) {
    return null
  }

  return (
    <CommandDialog
      description="Attach a file the library already holds."
      onOpenChange={onOpenChange}
      open={open}
      title="Add from Library"
    >
      <Command>
        <CommandInput
          aria-label="Search library files"
          name="project-library-search"
          placeholder="Search the library…"
        />
        <CommandList>
          <CommandEmpty>Nothing left to add.</CommandEmpty>
          {availableFiles.length > 0 && (
            <CommandGroup heading="Library">
              {availableFiles.map((file) => (
                <CommandItem
                  key={file.name}
                  onSelect={() => {
                    onAdd({
                      filename: file.name,
                      mediaType: getLibraryProjectSourceMediaType(file.name),
                    })
                    onOpenChange(false)
                  }}
                  value={file.name}
                >
                  <FileTextIcon />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <CommandShortcut className="tracking-normal">
                    {file.size}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

function ProjectChatComposer() {
  const [announcement, setAnnouncement] = useState("")
  const [draft, setDraft] = useState("")

  function announceUnavailableProjectChat() {
    const message = "Project chat persistence is not connected yet."
    setAnnouncement(message)
    toast.add({
      description: "Use New chat in sidebar to start a persisted chat.",
      title: "Project chat unavailable",
      type: "warning",
    })
  }

  return (
    <form
      aria-label="Start a project chat"
      onSubmit={(event) => {
        event.preventDefault()
        announceUnavailableProjectChat()
      }}
    >
      <InputGroup>
        <InputGroupTextarea
          aria-label="Message"
          autoComplete="off"
          className="min-h-0 px-4"
          data-1p-ignore
          data-lpignore="true"
          enterKeyHint="send"
          name="project-message"
          onChange={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          placeholder="Ask anything…"
          value={draft}
        />
        <ChatComposerToolbar
          canSend={Boolean(draft.trim())}
          isGenerating={false}
          onAnnouncementChange={setAnnouncement}
          onChooseFiles={announceUnavailableProjectChat}
          onStopResponse={() => {}}
        />
      </InputGroup>
      <p className="sr-only" role="status">
        {announcement}
      </p>
    </form>
  )
}

function ProjectDetailLoading() {
  return (
    <>
      <ProjectDetailHeader projectName="Loading…" />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </>
  )
}

function ProjectDetailNotFound() {
  return (
    <>
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
        </Empty>
      </section>
    </>
  )
}

/** Renders one project workspace with instructions, sources, and chats. */
export function ProjectDetail({ projectSlug }: { projectSlug: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { getProject, isReady, updateProject } = useProjects()
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const project = getProject(projectSlug)

  if (!project) {
    return isReady ? <ProjectDetailNotFound /> : <ProjectDetailLoading />
  }

  const projectSources = project.sources

  function addProjectSourceRecords(nextSources: ProjectSource[]) {
    const filenames = new Set(projectSources.map(({ filename }) => filename))
    const sources = nextSources.filter((source) => {
      if (filenames.has(source.filename)) {
        return false
      }

      filenames.add(source.filename)
      return true
    })

    if (sources.length > 0) {
      updateProject(projectSlug, {
        sources: [...projectSources, ...sources],
      })
    }
  }

  function addUploadedProjectSources(files: File[]) {
    addProjectSourceRecords(
      files.map((file) => ({
        filename: file.name,
        mediaType: file.type || "application/octet-stream",
      })),
    )
  }

  return (
    <>
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
            <h1 className="text-balance font-heading text-xl font-medium">
              {project.name}
            </h1>
            {project.description && (
              <p className="max-w-[70ch] text-pretty text-base text-muted-foreground sm:text-sm">
                {project.description}
              </p>
            )}
          </div>

          <ProjectChatComposer />

          <section className="flex flex-col gap-3" id="project-instructions">
            <ProjectSectionHeader
              action={
                <Button
                  className="h-11 sm:h-7"
                  onClick={() => setIsInstructionsOpen(true)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <PencilIcon data-icon="inline-start" />
                  Edit
                </Button>
              }
              title="Instructions"
            />
            <p className="whitespace-pre-wrap text-pretty text-base text-muted-foreground sm:text-sm">
              {project.instructions ??
                "No instructions yet. Every chat in this project will carry them."}
            </p>
          </section>

          <section className="flex flex-col gap-3" id="project-sources">
            <ProjectSectionHeader
              action={
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        className="h-11 sm:h-7"
                        size="sm"
                        type="button"
                        variant="outline"
                      />
                    }
                  >
                    <PlusIcon data-icon="inline-start" />
                    Add source
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <UploadIcon />
                        Upload
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsLibraryOpen(true)}>
                        <LibraryBigIcon />
                        Add from Library
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
              title="Sources"
            />
            {project.sources.length > 0 ? (
              <div className="@container">
                <div className="grid gap-2 @sm:grid-cols-2">
                  {project.sources.map((source) => (
                    <Attachment className="w-full" key={source.filename}>
                      <AttachmentMedia>
                        <FileTextIcon />
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>{source.filename}</AttachmentTitle>
                        <AttachmentDescription>
                          {formatProjectSourceType(source.mediaType)}
                        </AttachmentDescription>
                      </AttachmentContent>
                      <AttachmentActions>
                        <AttachmentAction
                          aria-label={`Remove ${source.filename} from project`}
                          className="relative opacity-0 group-focus-within/attachment:opacity-100 group-hover/attachment:opacity-100 pointer-coarse:opacity-100"
                          onClick={() =>
                            updateProject(project.slug, {
                              sources: project.sources.filter(
                                ({ filename }) => filename !== source.filename,
                              ),
                            })
                          }
                          type="button"
                        >
                          <XIcon />
                          <span
                            aria-hidden="true"
                            className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
                          />
                        </AttachmentAction>
                      </AttachmentActions>
                    </Attachment>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-pretty text-base text-muted-foreground sm:text-sm">
                No sources yet. Anything here is available to every chat in the
                project.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3" id="project-chats">
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
                            chats: project.chats.filter(
                              ({ id }) => id !== chat.id,
                            ),
                          })
                        }
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <XIcon />
                        <span
                          aria-hidden="true"
                          className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
                        />
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
        </div>
      </div>

      <input
        ref={fileInputRef}
        aria-label="Choose project source files"
        className="hidden"
        multiple
        name="project-sources"
        onChange={(event) => {
          addUploadedProjectSources(Array.from(event.currentTarget.files ?? []))
          event.currentTarget.value = ""
        }}
        type="file"
      />
      <ProjectLibrarySourceDialog
        existingSources={project.sources}
        onAdd={(source) => addProjectSourceRecords([source])}
        onOpenChange={setIsLibraryOpen}
        open={isLibraryOpen}
      />
      <ProjectInstructionsDialog
        onOpenChange={setIsInstructionsOpen}
        open={isInstructionsOpen}
        project={project}
      />
    </>
  )
}
