"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { isToday, isYesterday, subDays } from "date-fns"

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

// ponytail: local-time grouping renders on the server too; a viewer in a
// different timezone than the server may see a one-off hydration re-render.
function chatDateGroupLabel(updatedAt: Date, now: Date) {
  if (isToday(updatedAt)) {
    return "Today"
  }

  if (isYesterday(updatedAt)) {
    return "Yesterday"
  }

  if (updatedAt >= subDays(now, 7)) {
    return "Previous 7 days"
  }

  if (updatedAt >= subDays(now, 30)) {
    return "Previous 30 days"
  }

  return "Older"
}

/** Splits owned chats into a pinned section followed by recency sections. */
function groupOwnChats(ownChats: ChatConversationEntry[]) {
  const now = new Date()
  const groups: { chats: ChatConversationEntry[]; label: string }[] = []

  for (const chat of ownChats) {
    const label = chat.pinned
      ? "Pinned"
      : chatDateGroupLabel(chat.updatedAt, now)
    const group = groups.find((candidate) => candidate.label === label)

    if (group) {
      group.chats.push(chat)
    } else {
      groups.push({ chats: [chat], label })
    }
  }

  return groups
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
      {groupOwnChats(ownChats).map((group) => (
        <SidebarGroup
          className="group-data-[collapsible=icon]:hidden"
          key={group.label}
        >
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.chats.map((chat) => (
                <ChatConversationItem
                  chat={chat}
                  isActive={pathname === `/chat/${chat.id}`}
                  key={chat.id}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}

      {teamChats.length > 0 && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
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
