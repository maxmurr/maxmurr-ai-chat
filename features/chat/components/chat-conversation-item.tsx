"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EllipsisIcon,
  MessageCircleIcon,
  PinIcon,
  PinOffIcon,
} from "lucide-react";

import { pinChatAction, renameChatAction } from "@/features/chat/chat-actions";
import { ChatActionsMenuContent } from "@/features/chat/components/chat-actions-menu-content";
import { ChatDeleteDialog } from "@/features/chat/components/chat-dialogs";
import { ChatShareDialogContent } from "@/features/chat/components/chat-share-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import type { ChatVisibility } from "@/src/entities/models/chat";
import { cn } from "@/lib/utils";

/** Serializable owned chat row with everything its action menu needs. */
export type ChatConversationEntry = {
  activeStreamId: string | null;
  hasUnreadResponse: boolean;
  id: string;
  pinned: boolean;
  projectId: string | null;
  projectName: string | null;
  publicToken: string | null;
  title: string;
  updatedAt: Date;
  visibility: ChatVisibility;
};

type ChatConversationItemProps = {
  chat: ChatConversationEntry;
  className?: string;
  isActive: boolean;
  projects: { id: string; name: string }[];
  showPinAction?: boolean;
  showPinnedChatIcon?: boolean;
  showProjectName?: boolean;
};

/** Renders one renameable conversation link and its action menu. */
export function ChatConversationItem({
  chat,
  className,
  isActive,
  projects,
  showPinAction = true,
  showPinnedChatIcon = true,
  showProjectName = true,
}: ChatConversationItemProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);
  const conversationActionsRef = useRef<HTMLDivElement>(null);
  const conversationLinkRef = useRef<HTMLAnchorElement>(null);
  const movingTitleRef = useRef<HTMLSpanElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const restoreLinkFocusRef = useRef(false);
  const titleViewportRef = useRef<HTMLSpanElement>(null);
  const sidebarTitle =
    showProjectName && chat.projectName
      ? `${chat.title} · ${chat.projectName}`
      : chat.title;
  const isGeneratingResponse = chat.activeStreamId !== null;
  const hasUnreadResponse = chat.hasUnreadResponse && !isActive;
  const activityLabel = isGeneratingResponse
    ? ", generating response"
    : hasUnreadResponse
      ? ", unread response"
      : "";

  function toggleConversationPin() {
    void pinChatAction(chat.id, !chat.pinned).then((result) => {
      if (!result.ok) {
        toast.add({
          description: result.error,
          title: "Pin failed",
          type: "error",
        });
      }
    });
  }

  function finishRenaming(value: string) {
    const nextTitle = value.trim();

    if (nextTitle && nextTitle !== chat.title) {
      void renameChatAction(chat.id, nextTitle).then((result) => {
        if (!result.ok) {
          toast.add({
            description: result.error,
            title: "Rename failed",
            type: "error",
          });
        }
      });
    }

    setIsRenaming(false);
  }

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
      return;
    }

    if (restoreLinkFocusRef.current) {
      restoreLinkFocusRef.current = false;
      conversationLinkRef.current?.focus();
    }
  }, [isRenaming]);

  useEffect(() => {
    const conversationActions = conversationActionsRef.current;
    const movingTitle = movingTitleRef.current;
    const titleViewport = titleViewportRef.current;

    if (!conversationActions || !movingTitle || !titleViewport) {
      return;
    }

    const updateTitleOverflow = () => {
      const titleViewportRect = titleViewport.getBoundingClientRect();
      const titleVisibleWidth =
        conversationActions.getBoundingClientRect().left -
        titleViewportRect.left;

      titleViewport.style.setProperty(
        "--conversation-title-visible-width",
        `${titleVisibleWidth}px`
      );
      setIsTitleOverflowing(
        movingTitle.getBoundingClientRect().width - titleViewportRect.width > 1
      );
    };

    const resizeObserver = new ResizeObserver(updateTitleOverflow);
    resizeObserver.observe(conversationActions);
    resizeObserver.observe(movingTitle);
    resizeObserver.observe(titleViewport);
    updateTitleOverflow();

    return () => resizeObserver.disconnect();
  }, [chat.title]);

  return (
    <SidebarMenuItem className={cn(className)}>
      {isRenaming ? (
        <SidebarMenuButton className="bg-transparent! pr-2!" render={<div />}>
          {showPinnedChatIcon && chat.pinned && <MessageCircleIcon />}
          <Input
            ref={renameInputRef}
            aria-label={`Rename ${chat.title}`}
            autoComplete="off"
            className="-mx-1 h-auto w-full min-w-0 rounded-none border-0 bg-transparent px-1 py-0 focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
            defaultValue={chat.title}
            name="chat-title"
            spellCheck={false}
            type="text"
            onBlur={(event) => finishRenaming(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                restoreLinkFocusRef.current = true;
                finishRenaming(event.currentTarget.value);
                return;
              }

              if (event.key === "Escape") {
                event.stopPropagation();
                restoreLinkFocusRef.current = true;
                setIsRenaming(false);
              }
            }}
          />
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton
          className="pr-2! pointer-fine:group-hover/menu-item:bg-sidebar-accent pointer-fine:group-hover/menu-item:text-sidebar-accent-foreground"
          isActive={isActive}
          render={
            <Link
              ref={conversationLinkRef}
              aria-current={isActive ? "page" : undefined}
              aria-label={`${chat.title}${activityLabel}`}
              href={`/chat/${chat.id}`}
            />
          }
          title={sidebarTitle}
        >
          {showPinnedChatIcon && chat.pinned && <MessageCircleIcon />}
          <span
            ref={titleViewportRef}
            className={cn(
              "@container/title relative min-w-0 flex-1 text-clip!",
              isTitleOverflowing &&
                "mask-[linear-gradient(to_right,black,black_calc(100%-0.75rem),transparent)] motion-safe:pointer-fine:group-hover/menu-item:mask-[linear-gradient(to_right,transparent,black_0.75rem,black_calc(100%-0.75rem),transparent)]"
            )}
          >
            <span
              className={cn(
                "block overflow-hidden whitespace-nowrap",
                isTitleOverflowing &&
                  "motion-safe:pointer-fine:group-hover/menu-item:invisible"
              )}
            >
              {chat.title}
            </span>
            <span
              ref={movingTitleRef}
              aria-hidden
              className={cn(
                "invisible absolute inset-y-0 left-0 inline-block w-max",
                isTitleOverflowing &&
                  "motion-safe:pointer-fine:group-hover/menu-item:visible motion-safe:pointer-fine:group-hover/menu-item:translate-x-[calc(var(--conversation-title-visible-width)-100%)] motion-safe:pointer-fine:group-hover/menu-item:transition-transform motion-safe:pointer-fine:group-hover/menu-item:delay-300 motion-safe:pointer-fine:group-hover/menu-item:duration-[2s] motion-safe:pointer-fine:group-hover/menu-item:ease-linear"
              )}
            >
              {chat.title}
            </span>
          </span>
          {(isGeneratingResponse || hasUnreadResponse) && (
            <span
              aria-hidden="true"
              className="flex size-4 shrink-0 items-center justify-center"
              data-slot="chat-conversation-activity"
            >
              {isGeneratingResponse ? (
                <Spinner className="text-muted-foreground motion-reduce:animate-none" />
              ) : (
                <span
                  className="size-2 rounded-full bg-status-unread"
                  data-slot="chat-unread-indicator"
                />
              )}
            </span>
          )}
        </SidebarMenuButton>
      )}

      <div
        ref={conversationActionsRef}
        className={cn(
          "pointer-events-none absolute inset-y-0 right-1 flex items-center [--conversation-actions-background:var(--sidebar)] group-has-focus-visible/menu-item:[--conversation-actions-background:var(--sidebar-accent)] peer-data-active/menu-button:[--conversation-actions-background:var(--sidebar-accent)] pointer-fine:group-hover/menu-item:[--conversation-actions-background:var(--sidebar-accent)]",
          isRenaming && "invisible"
        )}
      >
        {showProjectName && chat.projectName && (
          <span className="max-w-24 truncate bg-[linear-gradient(to_right,transparent,var(--conversation-actions-background)_1.5rem)] pl-6 text-xs text-muted-foreground transition-transform duration-150 ease-in-out motion-reduce:transition-none lg:group-has-focus-visible/menu-item:translate-x-0 lg:pointer-fine:translate-x-12 lg:pointer-fine:group-hover/menu-item:translate-x-0">
            {chat.projectName}
          </span>
        )}

        <div className="pointer-events-auto flex items-center gap-1 bg-(--conversation-actions-background) pl-1 transition-opacity duration-150 ease-in-out motion-reduce:transition-none lg:group-has-focus-visible/menu-item:pointer-events-auto lg:group-has-focus-visible/menu-item:opacity-100 lg:pointer-fine:pointer-events-none lg:pointer-fine:opacity-0 lg:pointer-fine:group-hover/menu-item:pointer-events-auto lg:pointer-fine:group-hover/menu-item:opacity-100">
          {showPinAction && (
            <SidebarMenuAction
              aria-label={`${chat.pinned ? "Unpin" : "Pin"} ${chat.title}`}
              className="static! hidden cursor-pointer text-muted-foreground! after:-inset-3 hover:bg-transparent! hover:text-sidebar-accent-foreground! lg:flex"
              onClick={toggleConversationPin}
            >
              {chat.pinned ? <PinOffIcon /> : <PinIcon />}
            </SidebarMenuAction>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuAction
                  aria-label={`Open chat actions for ${chat.title}`}
                  className="static! cursor-pointer text-muted-foreground! after:-inset-3 hover:bg-transparent! hover:text-sidebar-accent-foreground! data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground!"
                />
              }
            >
              <EllipsisIcon />
            </DropdownMenuTrigger>
            <ChatActionsMenuContent
              align="start"
              chatId={chat.id}
              finalFocus={(closeType) =>
                renameInputRef.current ?? closeType === "keyboard"
              }
              onDelete={() => setIsDeleteDialogOpen(true)}
              onRename={() => setIsRenaming(true)}
              onShare={() => setIsShareDialogOpen(true)}
              onTogglePin={toggleConversationPin}
              pinned={chat.pinned}
              projectId={chat.projectId}
              projects={projects}
              side="right"
            />
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <ChatShareDialogContent
          chatId={chat.id}
          initialPublicToken={chat.publicToken}
          initialVisibility={chat.visibility}
        />
      </Dialog>

      <ChatDeleteDialog
        chat={chat}
        onDeleted={isActive ? () => router.push("/chat") : undefined}
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
      />
    </SidebarMenuItem>
  );
}
