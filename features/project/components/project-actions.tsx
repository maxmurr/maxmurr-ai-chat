"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  Trash2Icon,
} from "lucide-react";

import {
  AlertDialog,
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
import { toast } from "@/components/ui/toast";
import { TouchTarget } from "@/components/ui/touch-target";
import { ProjectDetailsDialog } from "@/features/project/components/project-details-dialog";
import {
  deleteProjectAction,
  pinProjectAction,
  updateProjectDetailsAction,
} from "@/features/project/project-actions";
import { cn } from "@/lib/utils";

/** States destructive Project deletion consequences in confirmation UI. */
export const PROJECT_DELETE_CONSEQUENCES =
  "Chats are deleted; Library Files remain available.";

/** Serializable Project fields required by its action menu. */
export type ProjectActionsEntry = {
  description: string | null;
  id: string;
  name: string;
  pinned: boolean;
};

type ProjectDialogProps = {
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  project: ProjectActionsEntry;
};

function ProjectEditDetailsDialog({
  className,
  onOpenChange,
  open,
  project,
}: ProjectDialogProps) {
  return (
    <ProjectDetailsDialog
      className={className}
      dialogDescription="Rename the project or change what it is for."
      idPrefix={`edit-${project.id}`}
      initialDescription={project.description ?? undefined}
      initialName={project.name}
      onOpenChange={onOpenChange}
      onSubmit={async (details) => {
        const result = await updateProjectDetailsAction(project.id, details);

        if (!result.ok) {
          toast.add({
            description: result.error,
            title: "Project update failed",
            type: "error",
          });
        }

        return result.ok;
      }}
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
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteCurrentProject() {
    setIsDeleting(true);
    const result = await deleteProjectAction(project.id);
    setIsDeleting(false);

    if (!result.ok) {
      toast.add({
        description: result.error,
        title: "Project deletion failed",
        type: "error",
      });
      return;
    }

    onOpenChange(false);
    onDeleted?.();
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className={cn(className)}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes “{project.name}” and its Custom Instructions.{" "}
            {PROJECT_DELETE_CONSEQUENCES}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 sm:h-8">Cancel</AlertDialogCancel>
          <Button
            className="h-11 sm:h-8"
            disabled={isDeleting}
            onClick={() => void deleteCurrentProject()}
            type="button"
            variant="destructive"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type ProjectActionsProps = {
  className?: string;
  deleteRedirect?: "/chat" | "/projects";
  project: ProjectActionsEntry;
};

/** Renders persisted Project pin, edit, and delete controls. */
export function ProjectActions({
  className,
  deleteRedirect,
  project,
}: ProjectActionsProps) {
  const [openDialog, setOpenDialog] = useState<"delete" | "edit" | null>(null);
  const router = useRouter();

  function toggleProjectPin() {
    void pinProjectAction(project.id, !project.pinned).then((result) => {
      if (!result.ok) {
        toast.add({
          description: result.error,
          title: "Project pin failed",
          type: "error",
        });
      }
    });
  }

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
            <DropdownMenuItem onClick={toggleProjectPin}>
              {project.pinned ? <PinOffIcon /> : <PinIcon />}
              {project.pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
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
          onDeleted={
            deleteRedirect ? () => router.push(deleteRedirect) : undefined
          }
          onOpenChange={(nextOpen) => !nextOpen && setOpenDialog(null)}
          open
          project={project}
        />
      )}
    </>
  );
}
