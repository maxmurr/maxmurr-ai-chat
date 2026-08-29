"use client";

import { useRouter } from "next/navigation";

import { ProjectDetailsDialog } from "@/features/project/components/project-details-dialog";
import { useProjects } from "@/features/project/components/project-state";

type NewProjectDialogProps = {
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

/** Creates a browser-local project and opens its detail route. */
export function NewProjectDialog({
  className,
  onOpenChange,
  open,
}: NewProjectDialogProps) {
  const { createProject } = useProjects();
  const router = useRouter();

  return (
    <ProjectDetailsDialog
      className={className}
      dialogDescription="Name it and say what it covers. Instructions and files come later."
      idPrefix="project"
      onOpenChange={onOpenChange}
      onSubmit={({ description, name }) => {
        const project = createProject(name, description);
        router.push(`/projects/${project.slug}`);
      }}
      open={open}
      submitLabel="Create project"
      title="New project"
    />
  );
}
