"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  EllipsisIcon,
  FolderPlusIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  Trash2Icon,
} from "lucide-react"

import { pinChatAction } from "@/app/chat/actions"
import { useChatConversationTitle } from "@/components/chat/chat-conversation-title"
import {
  ChatDeleteDialog,
  ChatRenameDialog,
} from "@/components/chat/chat-history"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"

/** Renders header menu actions for the currently open chat. */
export function ChatThreadActions({
  chatId,
  pinned,
}: {
  chatId: string
  pinned: boolean
}) {
  const router = useRouter()
  const { conversationTitle, setConversationTitle } =
    useChatConversationTitle()
  const [openDialog, setOpenDialog] = useState<"delete" | "rename" | null>(
    null
  )
  const chat = { id: chatId, title: conversationTitle }

  function toggleChatPin() {
    void pinChatAction(chatId, !pinned).then((result) => {
      if (!result.ok) {
        toast.add({
          description: result.error,
          title: "Pin failed",
          type: "error",
        })
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="More chat options"
              size="icon-sm"
              type="button"
              variant="ghost"
            />
          }
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={toggleChatPin}>
              {pinned ? <PinOffIcon /> : <PinIcon />}
              {pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpenDialog("rename")}>
              <PencilIcon />
              Rename
            </DropdownMenuItem>
            {/* Placeholder until projects exist. */}
            <DropdownMenuItem>
              <FolderPlusIcon />
              Add to project
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => setOpenDialog("delete")}
              variant="destructive"
            >
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {openDialog === "rename" && (
        <ChatRenameDialog
          chat={chat}
          onOpenChange={(open) => !open && setOpenDialog(null)}
          onRenamed={setConversationTitle}
          open
        />
      )}
      {openDialog === "delete" && (
        <ChatDeleteDialog
          chat={chat}
          onDeleted={() => router.push("/chat")}
          onOpenChange={(open) => !open && setOpenDialog(null)}
          open
        />
      )}
    </>
  )
}
