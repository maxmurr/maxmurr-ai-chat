"use client";

import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/toast";
import { ProjectDetailsDialog } from "@/features/project/components/project-details-dialog";
import { createProjectAction } from "@/features/project/project-actions";

type NewProjectDialogProps = {
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

/** Creates persisted Project and opens its id-backed detail route. */
export function NewProjectDialog({
  className,
  onOpenChange,
  open,
}: NewProjectDialogProps) {
  const router = useRouter();

  return (
    <ProjectDetailsDialog
      className={className}
      dialogDescription="Name it and say what it covers. Instructions and files come later."
      idPrefix="project"
      onOpenChange={onOpenChange}
      onSubmit={async (details) => {
        const result = await createProjectAction(details);

        if (!result.ok) {
          toast.add({
            description: result.error,
            title: "Project creation failed",
            type: "error",
          });
          return false;
        }

        router.push(`/projects/${result.projectId}`);
        return true;
      }}
      open={open}
      submitLabel="Create project"
      title="New project"
    />
  );
}
