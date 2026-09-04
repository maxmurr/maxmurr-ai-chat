"use client";

import type { ComponentProps } from "react";
import {
  CheckIcon,
  FolderMinusIcon,
  FolderPlusIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  ShareIcon,
  SquareCheckBigIcon,
  Trash2Icon,
} from "lucide-react";

import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import {
  attachChatToProjectAction,
  detachChatFromProjectAction,
} from "@/features/project/project-actions";
import { cn } from "@/lib/utils";

type ChatActionsMenuContentProps = Omit<
  ComponentProps<typeof DropdownMenuContent>,
  "children"
> & {
  chatId: string;
  onDelete: () => void;
  onProjectChange?: (projectId: string | null) => void;
  onRename: () => void;
  onSelect?: () => void;
  onShare?: () => void;
  onTogglePin: () => void;
  pinned: boolean;
  projectId: string | null;
  projects: { id: string; name: string }[];
};

/** Renders the shared owned Chat actions inside a dropdown menu. */
export function ChatActionsMenuContent({
  chatId,
  className,
  onDelete,
  onProjectChange,
  onRename,
  onSelect,
  onShare,
  onTogglePin,
  pinned,
  projectId,
  projects,
  ...props
}: ChatActionsMenuContentProps) {
  function showProjectActionError(error: string) {
    toast.add({
      description: error,
      title: "Project update failed",
      type: "error",
    });
  }

  function attachToProject(nextProjectId: string) {
    void attachChatToProjectAction(nextProjectId, chatId).then((result) => {
      if (!result.ok) {
        showProjectActionError(result.error);
        return;
      }

      onProjectChange?.(nextProjectId);
    });
  }

  function detachFromProject() {
    void detachChatFromProjectAction(chatId).then((result) => {
      if (!result.ok) {
        showProjectActionError(result.error);
        return;
      }

      onProjectChange?.(null);
    });
  }

  return (
    <DropdownMenuContent className={cn("w-48", className)} {...props}>
      {onSelect && (
        <>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onSelect}>
              <SquareCheckBigIcon />
              Select
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={onTogglePin}>
          {pinned ? <PinOffIcon /> : <PinIcon />}
          {pinned ? "Unpin" : "Pin"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRename}>
          <PencilIcon />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={projects.length === 0}>
            <FolderPlusIcon />
            {projectId ? "Move to project" : "Add to project"}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuGroup>
              {projects.map((project) => (
                <DropdownMenuItem
                  disabled={project.id === projectId}
                  key={project.id}
                  onClick={() => attachToProject(project.id)}
                >
                  {project.id === projectId && <CheckIcon />}
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {projectId && (
          <DropdownMenuItem onClick={detachFromProject}>
            <FolderMinusIcon />
            Remove from project
          </DropdownMenuItem>
        )}
        {onShare && (
          <DropdownMenuItem onClick={onShare}>
            <ShareIcon />
            Share
          </DropdownMenuItem>
        )}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={onDelete} variant="destructive">
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}
