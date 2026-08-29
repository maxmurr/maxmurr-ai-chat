"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDownIcon } from "lucide-react"

import {
  ChatConversationItem,
  type ChatConversationEntry,
} from "@/features/chat/components/chat-conversation-item"
import type { ChatDialogEntry } from "@/features/chat/components/chat-dialogs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

/** Serializable chat row rendered in the sidebar history. */
export type ChatHistoryEntry = ChatDialogEntry

/** Splits owned chats into pinned and recent sections. */
function groupOwnChats(ownChats: ChatConversationEntry[]) {
  const groups: { chats: ChatConversationEntry[]; label: string }[] = []

  for (const chat of ownChats) {
    const label = chat.pinned ? "Pinned" : "Recents"
    const group = groups.find((candidate) => candidate.label === label)

    if (group) {
      group.chats.push(chat)
    } else {
      groups.push({ chats: [chat], label })
    }
  }

  return groups
}

/** Renders own and team chat history in the sidebar. */
export function ChatHistory({
  ownChats,
  teamChats,
}: {
  ownChats: ChatConversationEntry[]
  teamChats: ChatHistoryEntry[]
}) {
  const pathname = usePathname()

  return (
    <>
      {groupOwnChats(ownChats).map((group) => (
        <SidebarGroup
          className="group-data-[collapsible=icon]:hidden"
          key={group.label}
        >
          <Collapsible defaultOpen>
            <SidebarGroupLabel
              className="group/chat-history-trigger cursor-pointer justify-between select-none"
              render={<CollapsibleTrigger />}
            >
              {group.label}
              <ChevronDownIcon
                aria-hidden="true"
                className="transition-transform duration-150 ease-out group-aria-expanded/chat-history-trigger:rotate-180 motion-reduce:transition-none"
              />
            </SidebarGroupLabel>
            <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.chats.map((chat) => (
                    <ChatConversationItem
                      chat={chat}
                      isActive={pathname === `/chat/${chat.id}`}
                      key={chat.id}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      ))}

      {teamChats.length > 0 && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teamChats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    isActive={pathname === `/chat/${chat.id}`}
                    render={<Link href={`/chat/${chat.id}`} />}
                    tooltip={chat.title}
                  >
                    <span className="truncate">{chat.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  )
}
