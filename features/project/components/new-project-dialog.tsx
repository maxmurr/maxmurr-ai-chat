"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { ProjectDetailsFields } from "@/features/project/components/project-details-fields"
import { useProjects } from "@/features/project/components/project-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type NewProjectDialogProps = {
  className?: string
  onOpenChange: (open: boolean) => void
  open: boolean
}

/** Creates a browser-local project and opens its detail route. */
export function NewProjectDialog({
  className,
  onOpenChange,
  open,
}: NewProjectDialogProps) {
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
      <DialogContent className={cn(className)}>
        <form className="contents" onSubmit={createNewProject}>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Name it and say what it covers. Instructions and files come later.
            </DialogDescription>
          </DialogHeader>

          <ProjectDetailsFields
            description={description}
            idPrefix="project"
            name={name}
            onDescriptionChange={setDescription}
            onNameChange={setName}
          />

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
