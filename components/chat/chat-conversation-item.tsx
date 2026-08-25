"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  EllipsisIcon,
  FolderPlusIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  ShareIcon,
  Trash2Icon,
} from "lucide-react"

import { useChatConversationTitle } from "@/components/chat/chat-conversation-title"
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
import { cn } from "@/lib/utils"

type ChatConversationItemProps = {
  className?: string
  conversationTitle: string
  isActive: boolean
  isPinned: boolean
  onConversationPinChange: (isPinned: boolean) => void
  onConversationTitleChange: (conversationTitle: string) => void
}

/** Renders one renameable conversation link and its action menu. */
export function ChatConversationItem({
  className,
  conversationTitle,
  isActive,
  isPinned,
  onConversationPinChange,
  onConversationTitleChange,
}: ChatConversationItemProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false)
  const conversationLinkRef = useRef<HTMLAnchorElement>(null)
  const movingTitleRef = useRef<HTMLSpanElement>(null)
  const pinActionRef = useRef<HTMLButtonElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const restoreLinkFocusRef = useRef(false)
  const titleViewportRef = useRef<HTMLSpanElement>(null)
  const { setConversationTitle: setActiveConversationTitle } =
    useChatConversationTitle()

  function toggleConversationPin() {
    onConversationPinChange(!isPinned)
  }

  function finishRenaming(value: string) {
    const nextTitle = value.trim()

    if (nextTitle && nextTitle !== conversationTitle) {
      onConversationTitleChange(nextTitle)

      if (isActive) {
        setActiveConversationTitle(nextTitle)
      }
    }

    setIsRenaming(false)
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
    const movingTitle = movingTitleRef.current
    const pinAction = pinActionRef.current
    const titleViewport = titleViewportRef.current

    if (!movingTitle || !pinAction || !titleViewport) {
      return
    }

    const updateTitleOverflow = () => {
      const titleVisibleWidth =
        pinAction.getBoundingClientRect().left -
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
    resizeObserver.observe(movingTitle)
    resizeObserver.observe(pinAction)
    resizeObserver.observe(titleViewport)
    updateTitleOverflow()

    return () => resizeObserver.disconnect()
  }, [conversationTitle])

  return (
    <SidebarMenuItem className={cn(className)}>
      {isRenaming ? (
        <SidebarMenuButton
          className="pr-2! group-hover/menu-item:bg-sidebar-accent group-hover/menu-item:text-sidebar-accent-foreground"
          isActive={isActive}
          render={<div />}
        >
          <input
            ref={renameInputRef}
            aria-label={`Rename ${conversationTitle}`}
            className="-mx-1 w-full min-w-0 rounded-sm bg-transparent px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            defaultValue={conversationTitle}
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
          className="pr-2! group-hover/menu-item:bg-sidebar-accent group-hover/menu-item:text-sidebar-accent-foreground"
          isActive={isActive}
          render={
            <Link
              ref={conversationLinkRef}
              aria-current={isActive ? "page" : undefined}
              href="/chat"
            />
          }
          title={conversationTitle}
        >
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
              {conversationTitle}
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
              {conversationTitle}
            </span>
          </span>
        </SidebarMenuButton>
      )}

      <div
        className="pointer-events-none absolute inset-y-0 right-1 flex items-center gap-1 pl-4 opacity-0 [background:linear-gradient(to_right,transparent,var(--sidebar-accent)_1rem)] group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100"
      >
        <SidebarMenuAction
          ref={pinActionRef}
          aria-label={`${isPinned ? "Unpin" : "Pin"} ${conversationTitle}`}
          className="static! pointer-events-auto cursor-pointer text-muted-foreground! after:-inset-3 hover:bg-transparent! hover:text-sidebar-accent-foreground!"
          onClick={toggleConversationPin}
        >
          {isPinned ? <PinOffIcon /> : <PinIcon />}
        </SidebarMenuAction>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuAction
                aria-label={`Open chat actions for ${conversationTitle}`}
                className="static! pointer-events-auto cursor-pointer text-muted-foreground! after:-inset-3 hover:bg-transparent! hover:text-sidebar-accent-foreground! data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground!"
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
                {isPinned ? <PinOffIcon /> : <PinIcon />}
                {isPinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                <PencilIcon />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FolderPlusIcon />
                Add to project
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShareIcon />
                Share
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive">
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </SidebarMenuItem>
  )
}
