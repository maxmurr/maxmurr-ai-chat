"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderIcon, LibraryBigIcon, PlusIcon } from "lucide-react";

import {
  ChatSearch,
  type ChatSearchEntry,
} from "@/features/chat/components/chat-search";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const NewProjectDialog = dynamic(() =>
  import("@/features/project/components/new-project-dialog").then(
    (module) => module.NewProjectDialog
  )
);

const destinationNavigation = [
  { label: "Projects", href: "/projects", icon: FolderIcon },
  { label: "Library", href: "/library", icon: LibraryBigIcon },
];

/** Renders app navigation with client-derived active route and chat search. */
export function ChatPrimaryNavigation({
  className,
  ownChats,
  teamChats,
}: {
  className?: string;
  ownChats: readonly ChatSearchEntry[];
  teamChats: readonly ChatSearchEntry[];
}) {
  const pathname = usePathname();
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const chats = [...ownChats, ...teamChats];

  return (
    <>
      <SidebarMenu className={cn(className)}>
        <SidebarMenuItem>
          <SidebarMenuButton render={<Link href="/chat" />} tooltip="New chat">
            <PlusIcon />
            <span>New chat</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <ChatSearch chats={chats} />

        {destinationNavigation.map((item) => (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              className={cn(
                item.href === "/projects" &&
                  "pointer-fine:group-hover/menu-item:bg-sidebar-accent pointer-fine:group-hover/menu-item:text-sidebar-accent-foreground"
              )}
              isActive={
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              }
              render={<Link href={item.href} />}
              tooltip={item.label}
            >
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
            {item.href === "/projects" && (
              <SidebarMenuAction
                aria-label="New project"
                className="text-muted-foreground! hover:bg-transparent! hover:text-sidebar-accent-foreground!"
                onClick={() => setIsNewProjectOpen(true)}
                showOnHover
                type="button"
              >
                <PlusIcon />
              </SidebarMenuAction>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      {isNewProjectOpen ? (
        <NewProjectDialog
          onOpenChange={setIsNewProjectOpen}
          open={isNewProjectOpen}
        />
      ) : null}
    </>
  );
}
