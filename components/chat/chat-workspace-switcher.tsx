"use client"

import { useEffect, useState } from "react"
import {
  BriefcaseBusinessIcon,
  ChevronsUpDownIcon,
  PlusIcon,
} from "lucide-react"

import { ChatSidebarIdentity } from "@/components/chat/chat-sidebar-identity"
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
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import {
  CreateChatWorkspaceDialog,
  type NewChatWorkspace,
} from "@/components/chat/create-chat-workspace-dialog"
import { cn } from "@/lib/utils"

/** Minimal persisted workspace data rendered by chat navigation. */
export type ChatWorkspaceSummary = {
  id: string
  name: string
}

type ChatWorkspace = ChatWorkspaceSummary & {
  icon: typeof BriefcaseBusinessIcon
  memberCount?: number
  plan: string
}

type ChatWorkspaceSwitcherProps = {
  activeWorkspaceId?: string
  className?: string
  initialWorkspaces: ChatWorkspaceSummary[]
}

function getChatWorkspaceDescription(workspace: ChatWorkspace) {
  if (!workspace.memberCount) {
    return workspace.plan
  }

  const memberLabel = workspace.memberCount === 1 ? "member" : "members"
  return `${workspace.plan} · ${workspace.memberCount} ${memberLabel}`
}

/** Renders persisted workspaces with mouse and command-key controls. */
export function ChatWorkspaceSwitcher({
  activeWorkspaceId,
  className,
  initialWorkspaces,
}: ChatWorkspaceSwitcherProps) {
  const initialChatWorkspaces = initialWorkspaces.map((workspace) => ({
    ...workspace,
    icon: BriefcaseBusinessIcon,
    plan: "Free",
  }))
  const [activeWorkspace, setActiveWorkspace] = useState(
    () =>
      initialChatWorkspaces.find(
        (workspace) => workspace.id === activeWorkspaceId
      ) ?? initialChatWorkspaces[0]
  )
  const [chatWorkspaces, setChatWorkspaces] = useState(initialChatWorkspaces)
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false)

  useEffect(() => {
    function handleWorkspaceShortcut(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || !event.code.startsWith("Digit")) {
        return
      }

      const workspace = chatWorkspaces[Number(event.code.slice(-1)) - 1]

      if (workspace) {
        event.preventDefault()
        setActiveWorkspace(workspace)
      }
    }

    window.addEventListener("keydown", handleWorkspaceShortcut)
    return () => window.removeEventListener("keydown", handleWorkspaceShortcut)
  }, [chatWorkspaces])

  function isWorkspaceNameAvailable(name: string) {
    const normalizedName = name.trim().toLowerCase()

    return Promise.resolve(
      !chatWorkspaces.some(
        (workspace) =>
          workspace.name.trim().toLowerCase() === normalizedName
      )
    )
  }

  function createChatWorkspace(workspace: NewChatWorkspace) {
    const createdWorkspace: ChatWorkspace = {
      id: crypto.randomUUID(),
      icon: BriefcaseBusinessIcon,
      memberCount: workspace.members.length + 1,
      name: workspace.name,
      plan: "Free",
    }

    setChatWorkspaces((currentWorkspaces) => [
      ...currentWorkspaces,
      createdWorkspace,
    ])
    setActiveWorkspace(createdWorkspace)
  }

  if (!activeWorkspace) {
    return null
  }

  return (
    <SidebarMenuItem className={cn(className)}>
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
          <span
            key={activeWorkspace.id}
            className="flex aspect-square size-8 shrink-0 animate-in items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground duration-200 ease-[cubic-bezier(0.34,1.35,0.64,1)] fade-in-0 zoom-in-75 motion-reduce:animate-none"
          >
            <activeWorkspace.icon />
          </span>
          <ChatSidebarIdentity
            description={getChatWorkspaceDescription(activeWorkspace)}
            title={activeWorkspace.name}
          />
          <ChevronsUpDownIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56" side="bottom">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            {chatWorkspaces.map((workspace, index) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => setActiveWorkspace(workspace)}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border">
                  <workspace.icon />
                </span>
                <div className="min-w-0 flex-1 truncate">{workspace.name}</div>
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setIsCreateWorkspaceOpen(true)}>
              <span className="flex size-8 shrink-0 items-center justify-center">
                <PlusIcon />
              </span>
              Add workspace
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateChatWorkspaceDialog
        isWorkspaceNameAvailable={isWorkspaceNameAvailable}
        onCreateWorkspace={createChatWorkspace}
        onOpenChange={setIsCreateWorkspaceOpen}
        open={isCreateWorkspaceOpen}
      />
    </SidebarMenuItem>
  )
}
