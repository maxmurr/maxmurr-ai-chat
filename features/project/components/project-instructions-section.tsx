"use client";

import { useState } from "react";
import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { ProjectSection } from "@/features/project/components/project-section";
import { updateProjectInstructionsAction } from "@/features/project/project-actions";
import { cn } from "@/lib/utils";

type ProjectInstructionsItem = {
  id: string;
  instructions: string;
};

type ProjectInstructionsDialogProps = {
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  project: ProjectInstructionsItem;
};

function ProjectInstructionsDialog({
  className,
  onOpenChange,
  open,
  project,
}: ProjectInstructionsDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  async function saveProjectInstructions(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    const instructions = String(
      new FormData(event.currentTarget).get("instructions") ?? ""
    ).trim();
    setIsSaving(true);
    const result = await updateProjectInstructionsAction(
      project.id,
      instructions
    );
    setIsSaving(false);

    if (!result.ok) {
      toast.add({
        description: result.error,
        title: "Instructions update failed",
        type: "error",
      });
      return;
    }

    onOpenChange(false);
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
            <FieldLabel htmlFor={`${project.id}-instructions`}>
              Instructions
            </FieldLabel>
            <Textarea
              className="min-h-40"
              defaultValue={project.instructions}
              id={`${project.id}-instructions`}
              maxLength={10_000}
              name="instructions"
              placeholder="Tone, house rules, and things the model keeps getting wrong…"
            />
          </Field>
          <DialogFooter>
            <Button className="h-11 sm:h-8" disabled={isSaving} type="submit">
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ProjectInstructionsSectionProps = {
  className?: string;
  project: ProjectInstructionsItem;
};

/** Renders persisted Project instructions with edit dialog. */
export function ProjectInstructionsSection({
  className,
  project,
}: ProjectInstructionsSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <ProjectSection
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
      className={className}
      id="project-instructions"
      title="Instructions"
    >
      <p className="text-base text-pretty whitespace-pre-wrap text-muted-foreground sm:text-sm">
        {project.instructions ||
          "No instructions yet. Every chat in this project will carry them."}
      </p>
      <ProjectInstructionsDialog
        onOpenChange={setIsDialogOpen}
        open={isDialogOpen}
        project={project}
      />
    </ProjectSection>
  );
}
