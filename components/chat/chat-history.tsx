"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { deleteChatAction, renameChatAction } from "@/app/chat/actions"
import {
  ChatConversationItem,
  type ChatConversationEntry,
} from "@/components/chat/chat-conversation-item"
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
import { Input } from "@/components/ui/input"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { toast } from "@/components/ui/toast"

/** Serializable chat row rendered in the sidebar history. */
export type ChatHistoryEntry = {
  id: string
  title: string
}

/** Renames one owned chat behind a small controlled dialog. */
export function ChatRenameDialog({
  chat,
  onOpenChange,
  onRenamed,
  open,
}: {
  chat: ChatHistoryEntry
  onOpenChange: (open: boolean) => void
  onRenamed?: (title: string) => void
  open: boolean
}) {
  const [title, setTitle] = useState(chat.title)

  async function renameChat() {
    const result = await renameChatAction(chat.id, title)

    if (!result.ok) {
      toast.add({ description: result.error, title: "Rename failed", type: "error" })
      return
    }

    onRenamed?.(title)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename chat</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void renameChat()
          }}
        >
          <Input
            aria-label="Chat title"
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
            required
            value={title}
          />
          <DialogFooter className="mt-4">
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Confirms and deletes one owned chat. */
export function ChatDeleteDialog({
  chat,
  onDeleted,
  onOpenChange,
  open,
}: {
  chat: ChatHistoryEntry
  onDeleted?: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  async function deleteChat() {
    const result = await deleteChatAction(chat.id)

    if (!result.ok) {
      toast.add({ description: result.error, title: "Delete failed", type: "error" })
      return
    }

    onOpenChange(false)
    onDeleted?.()
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
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

/** Renders own and team chat history in the sidebar. */
export function ChatHistory({
  ownChats,
  teamChats,
}: {
  ownChats: ChatConversationEntry[]
  teamChats: ChatHistoryEntry[]
}) {
  const pathname = usePathname()

  return (
    <>
      {ownChats.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ownChats.map((chat) => (
                <ChatConversationItem
                  chat={chat}
                  isActive={pathname === `/chat/${chat.id}`}
                  key={chat.id}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {teamChats.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teamChats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    isActive={pathname === `/chat/${chat.id}`}
                    render={<Link href={`/chat/${chat.id}`} />}
                    tooltip={chat.title}
                  >
                    <span className="truncate">{chat.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  )
}
