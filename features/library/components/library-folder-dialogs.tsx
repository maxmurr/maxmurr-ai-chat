"use client";

import type { FormEvent } from "react";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/** Collects a name before creating a flat Library Folder. */
export function LibraryCreateFolderDialog({
  className,
  folderName,
  isPending,
  onFolderNameChange,
  onOpenChange,
  onSubmit,
  open,
}: {
  className?: string;
  folderName: string;
  isPending: boolean;
  onFolderNameChange: (folderName: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className={cn(className)}>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Add flat grouping to this Workspace Library.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="library-folder-name">Name</FieldLabel>
              <Input
                autoFocus
                id="library-folder-name"
                maxLength={100}
                onChange={(event) =>
                  onFolderNameChange(event.currentTarget.value)
                }
                required
                value={folderName}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending && <Spinner data-icon="inline-start" />}
              Create Folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Confirms destructive deletion of one Library Folder and its Files. */
export function LibraryDeleteFolderDialog({
  className,
  folderName,
  isPending,
  onConfirm,
  onOpenChange,
  open,
}: {
  className?: string;
  folderName?: string;
  isPending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className={cn(className)} size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {folderName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Folder and every File inside it will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={onConfirm}
            variant="destructive"
          >
            {isPending && <Spinner data-icon="inline-start" />}
            Delete Folder
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
