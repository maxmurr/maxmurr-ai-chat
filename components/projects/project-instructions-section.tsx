"use client"

import { useState } from "react"
import { PencilIcon } from "lucide-react"

import type { ProjectRecord } from "@/components/projects/project-data"
import { ProjectSectionHeader } from "@/components/projects/project-section-header"
import { useProjects } from "@/components/projects/project-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ProjectInstructionsDialogProps = {
  className?: string
  onOpenChange: (open: boolean) => void
  open: boolean
  project: ProjectRecord
}

function ProjectInstructionsDialog({
  className,
  onOpenChange,
  open,
  project,
}: ProjectInstructionsDialogProps) {
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
      <DialogContent className={cn("sm:max-w-lg", className)}>
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

type ProjectInstructionsSectionProps = {
  className?: string
  project: ProjectRecord
}

/** Renders project instructions with its edit dialog. */
export function ProjectInstructionsSection({
  className,
  project,
}: ProjectInstructionsSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <section
      className={cn("flex flex-col gap-3", className)}
      id="project-instructions"
    >
      <ProjectSectionHeader
        action={
          <Button
            className="h-11 sm:h-7"
            onClick={() => setIsDialogOpen(true)}
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
      <p className="text-base text-pretty whitespace-pre-wrap text-muted-foreground sm:text-sm">
        {project.instructions ??
          "No instructions yet. Every chat in this project will carry them."}
      </p>
      <ProjectInstructionsDialog
        onOpenChange={setIsDialogOpen}
        open={isDialogOpen}
        project={project}
      />
    </section>
  )
}
