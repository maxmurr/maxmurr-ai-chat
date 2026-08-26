"use client"

import { useCallback, useEffect, useState } from "react"
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
import { toast } from "@/components/ui/toast"
import {
  CreateChatWorkspaceDialog,
  type NewChatWorkspace,
} from "@/components/chat/create-chat-workspace-dialog"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

/** Minimal persisted workspace data rendered by chat navigation. */
export type ChatWorkspaceSummary = {
  id: string
  name: string
}

type ChatWorkspace = ChatWorkspaceSummary & {
  icon: typeof BriefcaseBusinessIcon
  plan: string
}

type ChatWorkspaceSwitcherProps = {
  activeWorkspaceId?: string
  className?: string
  initialWorkspaces: ChatWorkspaceSummary[]
}

type SendChatWorkspaceInvitation = (invitation: {
  email: string
  organizationId: string
  role: "admin" | "member"
}) => Promise<{ error?: unknown }>

/** Invites initial members independently and returns normalized failed emails. */
export async function inviteChatWorkspaceMembers(
  organizationId: string,
  members: NewChatWorkspace["members"],
  sendInvitation: SendChatWorkspaceInvitation = (invitation) =>
    authClient.organization.inviteMember(invitation)
) {
  const results = await Promise.all(
    members.map(async ({ email, role }) => {
      const normalizedEmail = email.trim().toLowerCase()

      try {
        const { error } = await sendInvitation({
          email: normalizedEmail,
          organizationId,
          role,
        })

        return error ? normalizedEmail : null
      } catch {
        return normalizedEmail
      }
    })
  )

  return results.filter((email): email is string => email !== null)
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

  const switchChatWorkspace = useCallback(
    async (workspace: ChatWorkspace) => {
      if (workspace.id === activeWorkspace?.id) {
        return
      }

      try {
        const { error } = await authClient.organization.setActive({
          organizationId: workspace.id,
        })

        if (error) {
          throw new Error(
            `Chat workspace activation failed: ${error.message}`
          )
        }

        setActiveWorkspace(workspace)
      } catch (error) {
        console.error("Chat workspace activation failed", error)
        toast.add({
          description: "Current workspace did not change. Try again.",
          title: "Could not switch workspace",
          type: "error",
        })
      }
    },
    [activeWorkspace?.id]
  )

  useEffect(() => {
    function handleWorkspaceShortcut(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || !event.code.startsWith("Digit")) {
        return
      }

      const workspace = chatWorkspaces[Number(event.code.slice(-1)) - 1]

      if (workspace) {
        event.preventDefault()
        void switchChatWorkspace(workspace)
      }
    }

    window.addEventListener("keydown", handleWorkspaceShortcut)
    return () => window.removeEventListener("keydown", handleWorkspaceShortcut)
  }, [chatWorkspaces, switchChatWorkspace])

  async function createChatWorkspace(workspace: NewChatWorkspace) {
    const { data, error } = await authClient.organization.create({
      name: workspace.name,
      slug: crypto.randomUUID(),
    })

    if (error || !data) {
      throw new Error(
        `Chat workspace persistence failed: ${error?.message ?? "missing response data"}`
      )
    }

    const failedInvitationEmails = await inviteChatWorkspaceMembers(
      data.id,
      workspace.members
    )
    const createdWorkspace: ChatWorkspace = {
      id: data.id,
      icon: BriefcaseBusinessIcon,
      name: data.name,
      plan: "Free",
    }

    setChatWorkspaces((currentWorkspaces) => [
      ...currentWorkspaces,
      createdWorkspace,
    ])
    setActiveWorkspace(createdWorkspace)

    toast.add({
      description:
        failedInvitationEmails.length > 0
          ? `Could not invite ${new Intl.ListFormat("en").format(failedInvitationEmails)}.`
          : workspace.members.length > 0
            ? `${workspace.members.length} invitation${workspace.members.length === 1 ? "" : "s"} created.`
            : `${data.name} is ready.`,
      title:
        failedInvitationEmails.length > 0
          ? "Workspace created; some invitations failed"
          : "Workspace created",
      type: failedInvitationEmails.length > 0 ? "warning" : "success",
    })
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
            description={activeWorkspace.plan}
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
                onClick={() => void switchChatWorkspace(workspace)}
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
        onCreateWorkspace={createChatWorkspace}
        onOpenChange={setIsCreateWorkspaceOpen}
        open={isCreateWorkspaceOpen}
      />
    </SidebarMenuItem>
  )
}
