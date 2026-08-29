"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import type { ProjectRecord } from "@/features/project/components/project-data";
import { ProjectDetailsDialog } from "@/features/project/components/project-details-dialog";
import { useProjects } from "@/features/project/components/project-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TouchTarget } from "@/components/ui/touch-target";
import { cn } from "@/lib/utils";

type ProjectDialogProps = {
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  project: ProjectRecord;
};

function ProjectEditDetailsDialog({
  className,
  onOpenChange,
  open,
  project,
}: ProjectDialogProps) {
  const { updateProject } = useProjects();

  return (
    <ProjectDetailsDialog
      className={className}
      dialogDescription="Rename the project or change what it is for."
      idPrefix={`edit-${project.slug}`}
      initialDescription={project.description}
      initialName={project.name}
      onOpenChange={onOpenChange}
      onSubmit={(details) => updateProject(project.slug, details)}
      open={open}
      submitLabel="Save"
      title="Project details"
    />
  );
}

function ProjectDeleteDialog({
  className,
  onDeleted,
  onOpenChange,
  open,
  project,
}: ProjectDialogProps & { onDeleted?: () => void }) {
  const { deleteProject } = useProjects();

  function deleteCurrentProject() {
    deleteProject(project.slug);
    onOpenChange(false);
    onDeleted?.();
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className={cn(className)}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes “{project.name}” and its local instructions and
            sources. Chats remain available.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 sm:h-8">Cancel</AlertDialogCancel>
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
  );
}

type ProjectActionsProps = {
  className?: string;
  onDeleted?: () => void;
  project: ProjectRecord;
};

/** Renders edit and delete controls for one project. */
export function ProjectActions({
  className,
  onDeleted,
  project,
}: ProjectActionsProps) {
  const [openDialog, setOpenDialog] = useState<"delete" | "edit" | null>(null);
  const router = useRouter();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={`More options for ${project.name}`}
              className={cn("relative", className)}
              size="icon-sm"
              type="button"
              variant="ghost"
            />
          }
        >
          <MoreHorizontalIcon />
          <TouchTarget />
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
        <ProjectEditDetailsDialog
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
  );
}
