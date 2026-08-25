"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  EllipsisIcon,
  FolderPlusIcon,
  PencilIcon,
  PinIcon,
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
}

/** Renders one renameable conversation link and its action menu. */
export function ChatConversationItem({
  className,
  conversationTitle: initialTitle,
  isActive,
}: ChatConversationItemProps) {
  const [conversationTitle, setConversationTitle] = useState(initialTitle)
  const [isRenaming, setIsRenaming] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const conversationLinkRef = useRef<HTMLAnchorElement>(null)
  const restoreLinkFocusRef = useRef(false)
  const { setConversationTitle: setActiveConversationTitle } =
    useChatConversationTitle()

  function finishRenaming(value: string) {
    const nextTitle = value.trim()

    if (nextTitle && nextTitle !== conversationTitle) {
      setConversationTitle(nextTitle)

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

  return (
    <SidebarMenuItem className={cn(className)}>
      {isRenaming ? (
        <SidebarMenuButton isActive={isActive} render={<div />}>
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
          <span>{conversationTitle}</span>
        </SidebarMenuButton>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuAction
              aria-label={`Open chat actions for ${conversationTitle}`}
              className="after:-inset-3 data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              showOnHover
            />
          }
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-48"
          finalFocus={() => renameInputRef.current ?? true}
          side="right"
        >
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <PinIcon />
              Pin
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
    </SidebarMenuItem>
  )
}
