"use client";

import { useState } from "react";
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
import { NewProjectDialog } from "@/features/project/components/new-project-dialog";
import { cn } from "@/lib/utils";

const destinationNavigation = [
  { label: "Projects", href: "/projects", icon: FolderIcon },
  { label: "Library", href: "/library", icon: LibraryBigIcon },
];

/** Renders app navigation with client-derived active route and chat search. */
export function ChatPrimaryNavigation({
  chats,
  className,
}: {
  chats: ChatSearchEntry[];
  className?: string;
}) {
  const pathname = usePathname();
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

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

      <NewProjectDialog
        onOpenChange={setIsNewProjectOpen}
        open={isNewProjectOpen}
      />
    </>
  );
}
