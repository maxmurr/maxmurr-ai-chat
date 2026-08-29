"use client";

import type { ComponentProps } from "react";
import {
  FolderPlusIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  ShareIcon,
  Trash2Icon,
} from "lucide-react";

import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ChatActionsMenuContentProps = Omit<
  ComponentProps<typeof DropdownMenuContent>,
  "children"
> & {
  onDelete: () => void;
  onRename: () => void;
  onShare?: () => void;
  onTogglePin: () => void;
  pinned: boolean;
};

/** Renders the shared owned Chat actions inside a dropdown menu. */
export function ChatActionsMenuContent({
  className,
  onDelete,
  onRename,
  onShare,
  onTogglePin,
  pinned,
  ...props
}: ChatActionsMenuContentProps) {
  return (
    <DropdownMenuContent className={cn("w-48", className)} {...props}>
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={onTogglePin}>
          {pinned ? <PinOffIcon /> : <PinIcon />}
          {pinned ? "Unpin" : "Pin"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRename}>
          <PencilIcon />
          Rename
        </DropdownMenuItem>
        {/* Placeholder until Project assignment is implemented. */}
        <DropdownMenuItem>
          <FolderPlusIcon />
          Add to project
        </DropdownMenuItem>
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
