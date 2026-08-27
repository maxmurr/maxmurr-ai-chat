"use client"

import { useState } from "react"

import { deleteChatAction, renameChatAction } from "@/app/chat/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

/** Minimal owned chat data needed by rename and delete dialogs. */
export type ChatDialogEntry = {
  id: string
  title: string
}

type ChatDialogProps = {
  chat: ChatDialogEntry
  className?: string
  onOpenChange: (open: boolean) => void
  open: boolean
}

type ChatRenameDialogProps = ChatDialogProps & {
  onRenamed?: (title: string) => void
}

/** Renames one owned chat behind a controlled dialog. */
export function ChatRenameDialog({
  chat,
  className,
  onOpenChange,
  onRenamed,
  open,
}: ChatRenameDialogProps) {
  const [title, setTitle] = useState(chat.title)

  async function renameChat() {
    const result = await renameChatAction(chat.id, title)

    if (!result.ok) {
      toast.add({
        description: result.error,
        title: "Rename failed",
        type: "error",
      })
      return
    }

    onRenamed?.(title)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className={cn(className)}>
        <DialogHeader>
          <DialogTitle>Rename chat</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void renameChat()
          }}
        >
          <Field>
            <FieldLabel className="sr-only" htmlFor="rename-chat-title">
              Chat title
            </FieldLabel>
            <Input
              id="rename-chat-title"
              maxLength={80}
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </Field>
          <DialogFooter className="mt-4">
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type ChatDeleteDialogProps = ChatDialogProps & {
  onDeleted?: () => void
}

/** Confirms and deletes one owned chat. */
export function ChatDeleteDialog({
  chat,
  className,
  onDeleted,
  onOpenChange,
  open,
}: ChatDeleteDialogProps) {
  async function deleteChat() {
    const result = await deleteChatAction(chat.id)

    if (!result.ok) {
      toast.add({
        description: result.error,
        title: "Delete failed",
        type: "error",
      })
      return
    }

    onOpenChange(false)
    onDeleted?.()
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className={cn(className)}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete chat?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the chat and its messages. Shared links
            stop working.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => void deleteChat()}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
