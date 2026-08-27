"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { toast } from "@/components/ui/toast"

/** Serializable chat row rendered in the sidebar history. */
export type ChatHistoryEntry = {
  id: string
  title: string
}

type ChatHistoryDialog =
  | { chat: ChatHistoryEntry; kind: "delete" }
  | { chat: ChatHistoryEntry; kind: "rename" }
  | null

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

function ChatHistoryGroup({
  chats,
  label,
  renderItemAction,
}: {
  chats: ChatHistoryEntry[]
  label: string
  renderItemAction?: (chat: ChatHistoryEntry) => React.ReactNode
}) {
  const pathname = usePathname()

  if (chats.length === 0) {
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {chats.map((chat) => (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton
                isActive={pathname === `/chat/${chat.id}`}
                render={<Link href={`/chat/${chat.id}`} />}
                tooltip={chat.title}
              >
                <span className="truncate">{chat.title}</span>
              </SidebarMenuButton>
              {renderItemAction?.(chat)}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

/** Renders own and team chat history with owner rename and delete actions. */
export function ChatHistory({
  ownChats,
  teamChats,
}: {
  ownChats: ChatHistoryEntry[]
  teamChats: ChatHistoryEntry[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [dialog, setDialog] = useState<ChatHistoryDialog>(null)

  return (
    <>
      <ChatHistoryGroup
        chats={ownChats}
        label="Chats"
        renderItemAction={(chat) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuAction
                  aria-label={`Chat actions for ${chat.title}`}
                  showOnHover
                />
              }
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right">
              <DropdownMenuItem
                onClick={() => setDialog({ chat, kind: "rename" })}
              >
                <PencilIcon />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDialog({ chat, kind: "delete" })}
                variant="destructive"
              >
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
      <ChatHistoryGroup chats={teamChats} label="Team" />

      {dialog && (
        <ChatRenameDialog
          chat={dialog.chat}
          key={`rename-${dialog.chat.id}`}
          onOpenChange={(open) => !open && setDialog(null)}
          open={dialog.kind === "rename"}
        />
      )}
      {dialog && (
        <ChatDeleteDialog
          chat={dialog.chat}
          key={`delete-${dialog.chat.id}`}
          onDeleted={() => {
            if (pathname === `/chat/${dialog.chat.id}`) {
              router.push("/chat")
            }
          }}
          onOpenChange={(open) => !open && setDialog(null)}
          open={dialog.kind === "delete"}
        />
      )}
    </>
  )
}
