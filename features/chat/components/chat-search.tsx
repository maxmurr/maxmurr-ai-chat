"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderIcon, LibraryBigIcon, PlusIcon, SearchIcon } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

const chatSearchDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
});

const chatSearchActions = [
  { href: "/chat", icon: PlusIcon, label: "New chat" },
  { href: "/projects", icon: FolderIcon, label: "Projects" },
  { href: "/library", icon: LibraryBigIcon, label: "Library" },
];

/** Minimal chat data shown in search results. */
export type ChatSearchEntry = {
  id: string;
  title: string;
  updatedAt: Date;
};

/** Formats a chat search result date relative to the current local day. */
export function formatChatSearchUpdatedDate(updatedAt: Date, now = new Date()) {
  if (updatedAt.toDateString() === now.toDateString()) {
    return "Today";
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  return updatedAt.toDateString() === yesterday.toDateString()
    ? "Yesterday"
    : chatSearchDateFormatter.format(updatedAt);
}

/** Searches loaded chats and provides quick navigation actions. */
export function ChatSearch({ chats }: { chats: readonly ChatSearchEntry[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function navigateFromChatSearch(href: string) {
    setOpen(false);
    router.push(href);
  }

  useEffect(() => {
    function toggleChatSearch(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() !== "k" ||
        (!event.metaKey && !event.ctrlKey)
      ) {
        return;
      }

      event.preventDefault();
      setOpen((currentOpen) => !currentOpen);
    }

    document.addEventListener("keydown", toggleChatSearch);
    return () => document.removeEventListener("keydown", toggleChatSearch);
  }, []);

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setOpen(true)}
          tooltip="Search"
          type="button"
        >
          <SearchIcon />
          <span>Search</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <CommandDialog
        description="Search chats or jump to a section."
        onOpenChange={setOpen}
        open={open}
        title="Search"
      >
        <Command>
          <CommandInput
            aria-label="Search chats"
            autoComplete="off"
            name="chat-search"
            placeholder="Search chats..."
            spellCheck={false}
          />
          <CommandList>
            <CommandEmpty>No chats found.</CommandEmpty>
            <CommandGroup heading="Chats">
              {chats
                .toSorted(
                  (firstChat, secondChat) =>
                    secondChat.updatedAt.getTime() -
                    firstChat.updatedAt.getTime()
                )
                .map((chat) => {
                  const updatedLabel = formatChatSearchUpdatedDate(
                    chat.updatedAt
                  );

                  return (
                    <CommandItem
                      key={chat.id}
                      onSelect={() =>
                        navigateFromChatSearch(`/chat/${chat.id}`)
                      }
                      value={`${chat.title} ${updatedLabel}`}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {chat.title}
                      </span>
                      <CommandShortcut className="tracking-normal">
                        {updatedLabel}
                      </CommandShortcut>
                    </CommandItem>
                  );
                })}
            </CommandGroup>
            <CommandGroup heading="Actions">
              {chatSearchActions.map((action) => (
                <CommandItem
                  key={action.href}
                  onSelect={() => navigateFromChatSearch(action.href)}
                  value={action.label}
                >
                  <action.icon />
                  {action.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
