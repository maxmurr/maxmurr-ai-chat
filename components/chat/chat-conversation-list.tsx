"use client"

import { useState } from "react"

import { ChatConversationItem } from "@/components/chat/chat-conversation-item"
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const PINNED_GROUP_LABEL = "Pinned"

/** Identifies one conversation independently from its renameable title. */
export type ChatConversationSummary = {
  id: string
  title: string
}

/** Describes one server-provided conversation section. */
export type ChatConversationGroup = {
  label: string
  conversations: readonly ChatConversationSummary[]
}

type ChatConversationListEntry = {
  homeGroupLabel: string
  id: string
  isPinned: boolean
  title: string
}

/** Renders conversation groups and moves chats between their home and pinned sections. */
export function ChatConversationList({
  activeConversationId,
  className,
  conversationGroups,
}: {
  activeConversationId?: string
  className?: string
  conversationGroups: ReadonlyArray<ChatConversationGroup>
}) {
  const [conversations, setConversations] = useState<
    ChatConversationListEntry[]
  >(() => {
    const fallbackHomeGroupLabel =
      conversationGroups.find(({ label }) => label !== PINNED_GROUP_LABEL)
        ?.label ?? PINNED_GROUP_LABEL

    return conversationGroups.flatMap((group) =>
      group.conversations.map((conversation) => ({
        homeGroupLabel:
          group.label === PINNED_GROUP_LABEL
            ? fallbackHomeGroupLabel
            : group.label,
        id: conversation.id,
        isPinned: group.label === PINNED_GROUP_LABEL,
        title: conversation.title,
      }))
    )
  })

  function setConversationPinned(conversationId: string, isPinned: boolean) {
    setConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, isPinned }
          : conversation
      )
    )
  }

  function renameConversation(
    conversationId: string,
    conversationTitle: string
  ) {
    setConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, title: conversationTitle }
          : conversation
      )
    )
  }

  return (
    <SidebarContent className={cn(className)}>
      {conversationGroups.map((group) => {
        const groupedConversations = conversations.filter((conversation) =>
          group.label === PINNED_GROUP_LABEL
            ? conversation.isPinned
            : !conversation.isPinned &&
              conversation.homeGroupLabel === group.label
        )

        return (
          <SidebarGroup
            className="group-data-[collapsible=icon]:hidden"
            key={group.label}
          >
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {groupedConversations.map((conversation) => (
                  <ChatConversationItem
                    conversationId={conversation.id}
                    conversationTitle={conversation.title}
                    isActive={conversation.id === activeConversationId}
                    isPinned={conversation.isPinned}
                    key={conversation.id}
                    onConversationPinChange={(isPinned) =>
                      setConversationPinned(conversation.id, isPinned)
                    }
                    onConversationTitleChange={(conversationTitle) =>
                      renameConversation(conversation.id, conversationTitle)
                    }
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )
      })}
    </SidebarContent>
  )
}
