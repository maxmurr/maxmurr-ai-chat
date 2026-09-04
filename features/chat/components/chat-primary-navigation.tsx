"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

type NewChatShortcut = Pick<
  KeyboardEvent,
  "ctrlKey" | "key" | "metaKey" | "shiftKey"
>;

/** Returns whether keyboard event opens a new chat. */
export function isNewChatShortcut(event: NewChatShortcut) {
  return (
    event.shiftKey &&
    event.key.toLowerCase() === "o" &&
    (event.metaKey || event.ctrlKey)
  );
}

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
  const router = useRouter();
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const chats = [...ownChats, ...teamChats];

  useEffect(() => {
    function openNewChat(event: KeyboardEvent) {
      if (!isNewChatShortcut(event)) {
        return;
      }

      event.preventDefault();
      router.push("/chat");
    }

    window.addEventListener("keydown", openNewChat);
    return () => window.removeEventListener("keydown", openNewChat);
  }, [router]);

  return (
    <>
      <SidebarMenu className={cn(className)}>
        <SidebarMenuItem>
          <SidebarMenuButton
            aria-keyshortcuts="Meta+Shift+O Control+Shift+O"
            isActive={pathname === "/chat"}
            render={<Link href="/chat" />}
            tooltip="New chat"
          >
            <PlusIcon />
            <span>New chat</span>
            <span
              aria-hidden="true"
              className="ml-auto shrink-0 text-xs text-muted-foreground opacity-0 transition-opacity group-focus-visible/menu-button:opacity-100 group-data-[collapsible=icon]:hidden motion-reduce:transition-none pointer-fine:group-hover/menu-button:opacity-100"
            >
              ⌘⇧O
            </span>
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
