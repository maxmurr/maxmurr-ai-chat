"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"

import type { ProjectRecord } from "@/components/projects/project-data"
import { useProjects } from "@/components/projects/project-state"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"

/** Creates a browser-local project and opens its detail route. */
export function NewProjectDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const { createProject } = useProjects()
  const router = useRouter()
  const [description, setDescription] = useState("")
  const [name, setName] = useState("")

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen) {
      setDescription("")
      setName("")
    }

    onOpenChange(nextOpen)
  }

  function createNewProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      return
    }

    const project = createProject(trimmedName, description.trim() || undefined)
    changeOpen(false)
    router.push(`/projects/${project.slug}`)
  }

  return (
    <Dialog onOpenChange={changeOpen} open={open}>
      <DialogContent>
        <form className="contents" onSubmit={createNewProject}>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Name it and say what it covers. Instructions and files come later.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="project-name">Name</FieldLabel>
              <Input
                autoComplete="off"
                className="h-11 sm:h-8"
                id="project-name"
                name="name"
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder="Pricing revamp"
                required
                spellCheck={false}
                type="text"
                value={name}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="project-description">
                Description
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FieldLabel>
              <Textarea
                className="min-h-20"
                id="project-description"
                name="description"
                onChange={(event) => setDescription(event.currentTarget.value)}
                placeholder="What this project covers"
                value={description}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              className="h-11 sm:h-8"
              disabled={!name.trim()}
              type="submit"
            >
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProjectDetailsDialog({
  onOpenChange,
  open,
  project,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
  project: ProjectRecord
}) {
  const { updateProject } = useProjects()

  function updateProjectDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get("name") ?? "").trim()

    if (!name) {
      return
    }

    updateProject(project.slug, {
      description:
        String(formData.get("description") ?? "").trim() || undefined,
      name,
    })
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <form
          className="contents"
          key={`${project.name}:${project.description ?? ""}`}
          onSubmit={updateProjectDetails}
        >
          <DialogHeader>
            <DialogTitle>Project details</DialogTitle>
            <DialogDescription>
              Rename the project or change what it is for.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor={`edit-${project.slug}-name`}>
                Name
              </FieldLabel>
              <Input
                autoComplete="off"
                className="h-11 sm:h-8"
                defaultValue={project.name}
                id={`edit-${project.slug}-name`}
                name="name"
                placeholder="Pricing revamp"
                required
                spellCheck={false}
                type="text"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor={`edit-${project.slug}-description`}>
                Description
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FieldLabel>
              <Textarea
                className="min-h-20"
                defaultValue={project.description}
                id={`edit-${project.slug}-description`}
                name="description"
                placeholder="What this project covers"
              />
            </Field>
          </FieldGroup>

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

function ProjectDeleteDialog({
  onDeleted,
  onOpenChange,
  open,
  project,
}: {
  onDeleted?: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  project: ProjectRecord
}) {
  const { deleteProject } = useProjects()

  function deleteCurrentProject() {
    deleteProject(project.slug)
    onOpenChange(false)
    onDeleted?.()
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes “{project.name}” and its local instructions and
            sources. Chats remain available.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 sm:h-8">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-11 sm:h-8"
            onClick={deleteCurrentProject}
            variant="destructive"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Renders edit and delete controls for one project. */
export function ProjectActions({
  onDeleted,
  project,
}: {
  onDeleted?: () => void
  project: ProjectRecord
}) {
  const [openDialog, setOpenDialog] = useState<"delete" | "edit" | null>(null)
  const router = useRouter()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={`More options for ${project.name}`}
              className="relative"
              size="icon-sm"
              type="button"
              variant="ghost"
            />
          }
        >
          <MoreHorizontalIcon />
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setOpenDialog("edit")}>
              <PencilIcon />
              Edit details
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => setOpenDialog("delete")}
              variant="destructive"
            >
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {openDialog === "edit" && (
        <ProjectDetailsDialog
          onOpenChange={(nextOpen) => !nextOpen && setOpenDialog(null)}
          open
          project={project}
        />
      )}
      {openDialog === "delete" && (
        <ProjectDeleteDialog
          onDeleted={onDeleted ?? (() => router.push("/projects"))}
          onOpenChange={(nextOpen) => !nextOpen && setOpenDialog(null)}
          open
          project={project}
        />
      )}
    </>
  )
}
