"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  BadgeCheckIcon,
  BellIcon,
  BriefcaseBusinessIcon,
  ChevronsUpDownIcon,
  CreditCardIcon,
  EllipsisIcon,
  FlaskConicalIcon,
  FolderIcon,
  FolderPlusIcon,
  LibraryBigIcon,
  LogOutIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
  SparklesIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const currentUser = {
  name: "maxmurr",
  email: "maxmurr.m@gmail.com",
  avatar: "https://github.com/maxmurr.png",
  initials: "MM",
}

const workspaces = [
  { name: "Acme Inc.", plan: "Enterprise", icon: BriefcaseBusinessIcon },
  { name: "Acme Labs", plan: "Pro", icon: FlaskConicalIcon },
  { name: "Personal", plan: "Free", icon: UserRoundIcon },
]

const primaryNavigation = [
  { label: "New chat", href: "/chat", icon: PlusIcon },
  { label: "Search", href: "#search", icon: SearchIcon },
  { label: "Projects", href: "#projects", icon: FolderIcon },
  { label: "Library", href: "#library", icon: LibraryBigIcon },
]

const conversationGroups = [
  { label: "Pinned", conversations: ["Checkout 500s"] },
  {
    label: "Today",
    conversations: [
      "Review our pricing page",
      "Summarise this week’s incidents",
      "Billing: build or buy",
      "New onboarding flow",
    ],
  },
]

const activeConversation = "Billing: build or buy"

function ChatConversationItem({
  conversationTitle: initialTitle,
  isActive,
  onRename,
}: {
  conversationTitle: string
  isActive: boolean
  onRename?: (title: string) => void
}) {
  const [conversationTitle, setConversationTitle] = useState(initialTitle)
  const [isRenaming, setIsRenaming] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const conversationLinkRef = useRef<HTMLAnchorElement>(null)
  const restoreLinkFocusRef = useRef(false)

  function finishRenaming(value: string) {
    const nextTitle = value.trim()

    if (nextTitle && nextTitle !== conversationTitle) {
      setConversationTitle(nextTitle)
      onRename?.(nextTitle)
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
    <SidebarMenuItem>
      {isRenaming ? (
        <SidebarMenuButton isActive={isActive} render={<div />}>
          <input
            ref={renameInputRef}
            aria-label={`Rename ${conversationTitle}`}
            className="-mx-1 w-full min-w-0 rounded-sm bg-transparent px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            defaultValue={conversationTitle}
            onBlur={(event) => finishRenaming(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.nativeEvent.isComposing
              ) {
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

export default function ChatPage() {
  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0])
  const [activeConversationTitle, setActiveConversationTitle] =
    useState(activeConversation)

  useEffect(() => {
    function handleWorkspaceShortcut(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || !event.code.startsWith("Digit")) {
        return
      }

      const workspace = workspaces[Number(event.code.slice(-1)) - 1]

      if (workspace) {
        event.preventDefault()
        setActiveWorkspace(workspace)
      }
    }

    window.addEventListener("keydown", handleWorkspaceShortcut)
    return () => window.removeEventListener("keydown", handleWorkspaceShortcut)
  }, [])

  return (
    <SidebarProvider className="isolate h-svh">
      <Sidebar collapsible="icon" variant="floating">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      aria-label={`Switch workspace. Current workspace: ${activeWorkspace.name}`}
                      className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                      size="lg"
                    />
                  }
                >
                  <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                    <activeWorkspace.icon />
                  </span>
                  <div className="grid min-w-0 flex-1 text-left">
                    <div className="truncate font-medium">
                      {activeWorkspace.name}
                    </div>
                    <div className="truncate text-xs">
                      {activeWorkspace.plan}
                    </div>
                  </div>
                  <ChevronsUpDownIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-56"
                  side="bottom"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                    {workspaces.map((workspace, index) => (
                      <DropdownMenuItem
                        key={workspace.name}
                        onClick={() => setActiveWorkspace(workspace)}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border">
                          <workspace.icon />
                        </span>
                        <div className="min-w-0 flex-1 truncate">
                          {workspace.name}
                        </div>
                        <DropdownMenuShortcut>
                          ⌘{index + 1}
                        </DropdownMenuShortcut>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <span className="flex size-8 shrink-0 items-center justify-center">
                        <PlusIcon />
                      </span>
                      Add workspace
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>

          <SidebarMenu>
            {primaryNavigation.map((item) => (
              <SidebarMenuItem
                key={item.label}
                id={item.href.startsWith("#") ? item.href.slice(1) : undefined}
              >
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {conversationGroups.map((group) => (
            <SidebarGroup
              className="group-data-[collapsible=icon]:hidden"
              key={group.label}
            >
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.conversations.map((conversation) => (
                    <ChatConversationItem
                      conversationTitle={conversation}
                      isActive={conversation === activeConversation}
                      key={conversation}
                      onRename={
                        conversation === activeConversation
                          ? setActiveConversationTitle
                          : undefined
                      }
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                      size="lg"
                    />
                  }
                >
                  <Avatar>
                    <AvatarImage
                      src={currentUser.avatar}
                      alt={currentUser.name}
                    />
                    <AvatarFallback>{currentUser.initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left leading-4">
                    <div className="truncate font-medium">
                      {currentUser.name}
                    </div>
                    <div className="truncate text-xs">{currentUser.email}</div>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-56"
                  side="bottom"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-0 font-normal text-foreground">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left">
                        <Avatar>
                          <AvatarImage
                            src={currentUser.avatar}
                            alt={currentUser.name}
                          />
                          <AvatarFallback>
                            {currentUser.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid min-w-0 flex-1 text-left text-sm leading-4">
                          <div className="truncate font-medium">
                            {currentUser.name}
                          </div>
                          <div className="truncate text-xs">
                            {currentUser.email}
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <SparklesIcon />
                      Upgrade to Pro
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <BadgeCheckIcon />
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCardIcon />
                      Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BellIcon />
                      Notifications
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <LogOutIcon />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 px-3">
          <SidebarTrigger aria-label="Toggle sidebar" />
          <Separator
            className="data-vertical:h-4 data-vertical:self-auto"
            orientation="vertical"
          />
          <p className="truncate text-sm">{activeConversationTitle}</p>
        </header>
        <div className="min-h-0 flex-1" />
      </SidebarInset>
    </SidebarProvider>
  )
}
