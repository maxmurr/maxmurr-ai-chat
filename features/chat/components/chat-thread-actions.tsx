"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { EllipsisIcon } from "lucide-react";

import { pinChatAction } from "@/features/chat/chat-actions";
import { ChatActionsMenuContent } from "@/features/chat/components/chat-actions-menu-content";
import {
  dispatchOptimisticChatListAction,
  useOptimisticChatEntry,
} from "@/features/chat/hooks/use-optimistic-chat-list";
import { useChatConversationTitle } from "@/features/chat/components/chat-conversation-title";
import {
  ChatDeleteDialog,
  ChatRenameDialog,
} from "@/features/chat/components/chat-dialogs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/** Renders header menu actions for the currently open chat. */
export function ChatThreadActions({
  chatId,
  className,
  pinned,
  projectId,
  projects,
}: {
  chatId: string;
  className?: string;
  pinned: boolean;
  projectId: string | null;
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { conversationTitle } = useChatConversationTitle();
  const optimisticChat = useOptimisticChatEntry({
    id: chatId,
    pinned,
    projectId,
  });
  const [openDialog, setOpenDialog] = useState<"delete" | "rename" | null>(
    null
  );
  const chat = { id: chatId, title: conversationTitle };

  function toggleChatPin() {
    const nextPinned = !optimisticChat.pinned;

    startTransition(async () => {
      dispatchOptimisticChatListAction({
        chatId,
        changes: { pinned: nextPinned },
        type: "update",
      });
      const result = await pinChatAction(chatId, nextPinned);

      if (!result.ok) {
        toast.add({
          description: result.error,
          title: "Pin failed",
          type: "error",
        });
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="More chat options"
              className={cn(className)}
              size="icon-sm"
              type="button"
              variant="ghost"
            />
          }
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <ChatActionsMenuContent
          align="end"
          chatId={chatId}
          onDelete={() => setOpenDialog("delete")}
          onRename={() => setOpenDialog("rename")}
          onTogglePin={toggleChatPin}
          pinned={optimisticChat.pinned}
          projectId={optimisticChat.projectId}
          projects={projects}
        />
      </DropdownMenu>

      {openDialog === "rename" && (
        <ChatRenameDialog
          chat={chat}
          onOpenChange={(open) => !open && setOpenDialog(null)}
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
  );
}
