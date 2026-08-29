"use client"

import { useRef, useState } from "react"
import {
  FileTextIcon,
  LibraryBigIcon,
  PlusIcon,
  UploadIcon,
  XIcon,
} from "lucide-react"

import { LIBRARY_ITEMS } from "@/features/library/components/library-data"
import {
  formatProjectSourceType,
  type ProjectRecord,
  type ProjectSource,
} from "@/features/project/components/project-data"
import { ProjectSectionHeader } from "@/features/project/components/project-section-header"
import { useProjects } from "@/features/project/components/project-state"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { TouchTarget } from "@/components/ui/touch-target"
import { cn } from "@/lib/utils"

function getLibraryProjectSourceMediaType(filename: string) {
  if (filename.endsWith(".pdf")) {
    return "application/pdf"
  }

  if (filename.endsWith(".csv")) {
    return "text/csv"
  }

  return "application/octet-stream"
}

type ProjectLibrarySourceDialogProps = {
  className?: string
  existingSources: ProjectSource[]
  onAdd: (source: ProjectSource) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

function ProjectLibrarySourceDialog({
  className,
  existingSources,
  onAdd,
  onOpenChange,
  open,
}: ProjectLibrarySourceDialogProps) {
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
      className={cn(className)}
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

type ProjectSourcesSectionProps = {
  className?: string
  project: ProjectRecord
}

/** Renders project files with upload, library attach, and removal actions. */
export function ProjectSourcesSection({
  className,
  project,
}: ProjectSourcesSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const { updateProject } = useProjects()
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
      updateProject(project.slug, {
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
    <section
      className={cn("flex flex-col gap-3", className)}
      id="project-sources"
    >
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

      {projectSources.length > 0 ? (
        <div className="@container">
          <div className="grid gap-2 @sm:grid-cols-2">
            {projectSources.map((source) => (
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
                        sources: projectSources.filter(
                          ({ filename }) => filename !== source.filename,
                        ),
                      })
                    }
                    type="button"
                  >
                    <XIcon />
                    <TouchTarget />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-base text-pretty text-muted-foreground sm:text-sm">
          No sources yet. Anything here is available to every chat in the
          project.
        </p>
      )}

      <Input
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
        existingSources={projectSources}
        onAdd={(source) => addProjectSourceRecords([source])}
        onOpenChange={setIsLibraryOpen}
        open={isLibraryOpen}
      />
    </section>
  )
}
