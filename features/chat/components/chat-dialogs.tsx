"use client";

import { startTransition, useOptimistic, useState } from "react";

import {
  deleteChatAction,
  renameChatAction,
} from "@/features/chat/chat-actions";
import { dispatchOptimisticChatListAction } from "@/features/chat/hooks/use-optimistic-chat-list";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/** Minimal owned chat data needed by rename and delete dialogs. */
export type ChatDialogEntry = {
  id: string;
  title: string;
};

type ChatDialogProps = {
  chat: ChatDialogEntry;
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

type ChatRenameDialogProps = ChatDialogProps & {
  onRenamed?: (title: string) => void;
};

/** Renames one owned chat behind a controlled dialog. */
export function ChatRenameDialog({
  chat,
  className,
  onOpenChange,
  onRenamed,
  open,
}: ChatRenameDialogProps) {
  const [isRenaming, setIsRenaming] = useOptimistic(false);
  const [title, setTitle] = useState(chat.title);

  async function renameChat() {
    const nextTitle = title.trim();
    if (!nextTitle) return;

    setIsRenaming(true);
    dispatchOptimisticChatListAction({
      chatId: chat.id,
      changes: { title: nextTitle },
      type: "update",
    });

    const result = await renameChatAction(chat.id, nextTitle);

    if (!result.ok) {
      toast.add({
        description: result.error,
        title: "Rename failed",
        type: "error",
      });
      return;
    }

    startTransition(() => {
      onRenamed?.(nextTitle);
      onOpenChange(false);
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className={cn(className)}>
        <DialogHeader>
          <DialogTitle>Rename chat</DialogTitle>
        </DialogHeader>
        <form action={renameChat}>
          <Field>
            <FieldLabel className="sr-only" htmlFor="rename-chat-title">
              Chat title
            </FieldLabel>
            <Input
              disabled={isRenaming}
              id="rename-chat-title"
              maxLength={80}
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </Field>
          <DialogFooter className="mt-4">
            <Button disabled={isRenaming || !title.trim()} type="submit">
              {isRenaming && <Spinner data-icon="inline-start" />}
              {isRenaming ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ChatDeleteDialogProps = ChatDialogProps & {
  onDeleted?: () => void;
};

/** Confirms and deletes one owned chat. */
export function ChatDeleteDialog({
  chat,
  className,
  onDeleted,
  onOpenChange,
  open,
}: ChatDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useOptimistic(false);

  async function deleteChat() {
    setIsDeleting(true);
    dispatchOptimisticChatListAction({
      chatIds: [chat.id],
      type: "delete",
    });

    const result = await deleteChatAction(chat.id);

    if (!result.ok) {
      toast.add({
        description: result.error,
        title: "Delete failed",
        type: "error",
      });
      return;
    }

    startTransition(() => {
      onOpenChange(false);
      onDeleted?.();
    });
  }

  return (
    <AlertDialog
      onOpenChange={(nextOpen) => {
        if (!isDeleting) onOpenChange(nextOpen);
      }}
      open={open}
    >
      <AlertDialogContent className={cn(className)}>
        <form action={deleteChat} className="contents">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the chat and its messages. Shared links
              stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} type="button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              type="submit"
              variant="destructive"
            >
              {isDeleting && <Spinner data-icon="inline-start" />}
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
