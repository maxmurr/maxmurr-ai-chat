"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  EllipsisIcon,
  FolderPlusIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

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

/** Renders header menu actions for the currently open chat. */
export function ChatThreadActions({ chatId }: { chatId: string }) {
  const router = useRouter()
  const { conversationTitle, setConversationTitle } =
    useChatConversationTitle()
  const [openDialog, setOpenDialog] = useState<"delete" | "rename" | null>(
    null
  )
  const chat = { id: chatId, title: conversationTitle }

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
