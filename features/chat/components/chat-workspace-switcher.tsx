"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";

import { ChatSidebarIdentity } from "@/features/chat/components/chat-sidebar-identity";
import { switchWorkspaceAction } from "@/features/workspace/workspace-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const CreateWorkspaceDialog = dynamic(() =>
  import("@/features/workspace/components/create-workspace-dialog").then(
    (module) => module.CreateWorkspaceDialog
  )
);

/** Minimal persisted workspace data rendered by chat navigation. */
export type ChatWorkspaceSummary = {
  id: string;
  name: string;
};

/** Renders server-owned workspaces with client switching controls. */
export function ChatWorkspaceSwitcher({
  activeWorkspaceId,
  className,
  workspaces,
}: {
  activeWorkspaceId: string;
  className?: string;
  workspaces: ChatWorkspaceSummary[];
}) {
  const activeWorkspace =
    workspaces.find(({ id }) => id === activeWorkspaceId) ?? workspaces[0];
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const switchChatWorkspace = useCallback(
    (workspace: ChatWorkspaceSummary) => {
      if (workspace.id === activeWorkspace?.id) {
        return;
      }

      startTransition(async () => {
        const result = await switchWorkspaceAction(workspace.id);

        if (!result.ok) {
          toast.add({
            description: "Current workspace did not change. Try again.",
            title: "Could not switch workspace",
            type: "error",
          });
        }
      });
    },
    [activeWorkspace?.id]
  );

  useEffect(() => {
    function handleWorkspaceShortcut(event: KeyboardEvent) {
      if (
        !(event.metaKey || event.ctrlKey) ||
        !event.code.startsWith("Digit")
      ) {
        return;
      }

      const workspace = workspaces[Number(event.code.slice(-1)) - 1];

      if (workspace) {
        event.preventDefault();
        switchChatWorkspace(workspace);
      }
    }

    window.addEventListener("keydown", handleWorkspaceShortcut);
    return () => window.removeEventListener("keydown", handleWorkspaceShortcut);
  }, [switchChatWorkspace, workspaces]);

  if (!activeWorkspace) {
    return null;
  }

  return (
    <SidebarMenuItem
      className={cn(className)}
      data-pending={isPending || undefined}
    >
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
            aria-hidden="true"
            className="flex aspect-square size-8 shrink-0 animate-in items-center justify-center rounded-md bg-sidebar-primary font-medium text-sidebar-primary-foreground duration-200 ease-[cubic-bezier(0.34,1.35,0.64,1)] fade-in-0 zoom-in-75 motion-reduce:animate-none"
          >
            {activeWorkspace.name.trim().charAt(0).toUpperCase()}
          </span>
          <ChatSidebarIdentity title={activeWorkspace.name} />
          <ChevronsUpDownIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56" side="bottom">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            {workspaces.map((workspace, index) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => switchChatWorkspace(workspace)}
              >
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-md border font-medium"
                >
                  {workspace.name.trim().charAt(0).toUpperCase()}
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
      {isCreateWorkspaceOpen ? (
        <CreateWorkspaceDialog
          onOpenChange={setIsCreateWorkspaceOpen}
          open={isCreateWorkspaceOpen}
        />
      ) : null}
    </SidebarMenuItem>
  );
}
