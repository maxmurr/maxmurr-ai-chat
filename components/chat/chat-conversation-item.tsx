"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  EllipsisIcon,
  FolderPlusIcon,
  MessageCircleIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  ShareIcon,
  Trash2Icon,
} from "lucide-react"

import {
  deleteChatAction,
  pinChatAction,
  renameChatAction,
} from "@/app/chat/actions"
import { useChatConversationTitle } from "@/components/chat/chat-conversation-title"
import { ChatShareDialogContent } from "@/components/chat/chat-share-dialog"
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
import { Dialog } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { toast } from "@/components/ui/toast"
import type { ChatVisibility } from "@/src/entities/models/chat"
import { cn } from "@/lib/utils"

/** Serializable owned chat row with everything its action menu needs. */
export type ChatConversationEntry = {
  id: string
  pinned: boolean
  publicToken: string | null
  title: string
  visibility: ChatVisibility
}

type ChatConversationItemProps = {
  chat: ChatConversationEntry
  className?: string
  isActive: boolean
}

/** Renders one renameable conversation link and its action menu. */
export function ChatConversationItem({
  chat,
  className,
  isActive,
}: ChatConversationItemProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false)
  const conversationActionsRef = useRef<HTMLDivElement>(null)
  const conversationLinkRef = useRef<HTMLAnchorElement>(null)
  const movingTitleRef = useRef<HTMLSpanElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const restoreLinkFocusRef = useRef(false)
  const titleViewportRef = useRef<HTMLSpanElement>(null)
  const { setConversationTitle: setActiveConversationTitle } =
    useChatConversationTitle()

  function toggleConversationPin() {
    void pinChatAction(chat.id, !chat.pinned).then((result) => {
      if (!result.ok) {
        toast.add({ description: result.error, title: "Pin failed", type: "error" })
      }
    })
  }

  function finishRenaming(value: string) {
    const nextTitle = value.trim()

    if (nextTitle && nextTitle !== chat.title) {
      void renameChatAction(chat.id, nextTitle).then((result) => {
        if (!result.ok) {
          toast.add({ description: result.error, title: "Rename failed", type: "error" })
        }
      })

      if (isActive) {
        setActiveConversationTitle(nextTitle)
      }
    }

    setIsRenaming(false)
  }

  async function deleteConversation() {
    const result = await deleteChatAction(chat.id)

    if (!result.ok) {
      toast.add({ description: result.error, title: "Delete failed", type: "error" })
      return
    }

    setIsDeleteDialogOpen(false)

    if (isActive) {
      router.push("/chat")
    }
  }

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
      return
    }

    if (restoreLinkFocusRef.current) {
      restoreLinkFocusRef.current = false
      conversationLinkRef.current?.focus()
    }
  }, [isRenaming])

  useEffect(() => {
    const conversationActions = conversationActionsRef.current
    const movingTitle = movingTitleRef.current
    const titleViewport = titleViewportRef.current

    if (!conversationActions || !movingTitle || !titleViewport) {
      return
    }

    const updateTitleOverflow = () => {
      const titleVisibleWidth =
        conversationActions.getBoundingClientRect().left -
        titleViewport.getBoundingClientRect().left

      titleViewport.style.setProperty(
        "--conversation-title-visible-width",
        `${titleVisibleWidth - 16}px`
      )
      setIsTitleOverflowing(
        movingTitle.getBoundingClientRect().width - titleVisibleWidth > 1
      )
    }

    const resizeObserver = new ResizeObserver(updateTitleOverflow)
    resizeObserver.observe(conversationActions)
    resizeObserver.observe(movingTitle)
    resizeObserver.observe(titleViewport)
    updateTitleOverflow()

    return () => resizeObserver.disconnect()
  }, [chat.title])

  return (
    <SidebarMenuItem className={cn(className)}>
      {isRenaming ? (
        <SidebarMenuButton
          className="pr-2! pointer-fine:group-hover/menu-item:bg-sidebar-accent pointer-fine:group-hover/menu-item:text-sidebar-accent-foreground"
          isActive={isActive}
          render={<div />}
        >
          {chat.pinned && <MessageCircleIcon />}
          <input
            ref={renameInputRef}
            aria-label={`Rename ${chat.title}`}
            className="-mx-1 w-full min-w-0 rounded-sm bg-transparent px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            defaultValue={chat.title}
            onBlur={(event) => finishRenaming(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault()
                restoreLinkFocusRef.current = true
                finishRenaming(event.currentTarget.value)
                return
              }

              if (event.key === "Escape") {
                event.stopPropagation()
                restoreLinkFocusRef.current = true
                setIsRenaming(false)
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
              href={`/chat/${chat.id}`}
            />
          }
          title={chat.title}
        >
          {chat.pinned && <MessageCircleIcon />}
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
        </SidebarMenuButton>
      )}

      <div
        ref={conversationActionsRef}
        className="pointer-events-none absolute inset-y-0 right-1 flex items-center gap-1 pl-4 opacity-100 lg:opacity-0 lg:[background:linear-gradient(to_right,transparent,var(--sidebar-accent)_1rem)] lg:group-has-focus-visible/menu-item:opacity-100 lg:group-hover/menu-item:opacity-100"
      >
        <SidebarMenuAction
          aria-label={`${chat.pinned ? "Unpin" : "Pin"} ${chat.title}`}
          className="pointer-events-auto static! hidden cursor-pointer text-muted-foreground! after:-inset-3 hover:bg-transparent! hover:text-sidebar-accent-foreground! lg:flex"
          onClick={toggleConversationPin}
        >
          {chat.pinned ? <PinOffIcon /> : <PinIcon />}
        </SidebarMenuAction>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuAction
                aria-label={`Open chat actions for ${chat.title}`}
                className="pointer-events-auto static! cursor-pointer text-muted-foreground! after:-inset-3 hover:bg-transparent! hover:text-sidebar-accent-foreground! data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground!"
              />
            }
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-48"
            finalFocus={(closeType) =>
              renameInputRef.current ?? (closeType === "keyboard")
            }
            side="right"
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={toggleConversationPin}>
                {chat.pinned ? <PinOffIcon /> : <PinIcon />}
                {chat.pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                <PencilIcon />
                Rename
              </DropdownMenuItem>
              {/* Placeholder until projects exist. */}
              <DropdownMenuItem>
                <FolderPlusIcon />
                Add to project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
                <ShareIcon />
                Share
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                variant="destructive"
              >
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <ChatShareDialogContent
          chatId={chat.id}
          initialPublicToken={chat.publicToken}
          initialVisibility={chat.visibility}
        />
      </Dialog>

      <AlertDialog
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
      >
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
            <AlertDialogAction onClick={() => void deleteConversation()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMenuItem>
  )
}
