"use client"

import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react"

import { cn } from "@/lib/utils"

type ChatConversationTitleContextValue = {
  conversationTitle: string
  setConversationTitle: (conversationTitle: string) => void
}

const ChatConversationTitleContext =
  createContext<ChatConversationTitleContextValue | null>(null)

/** Shares active conversation title state between isolated client controls. */
export function ChatConversationTitleProvider({
  children,
  initialTitle,
}: {
  children: ReactNode
  initialTitle: string
}) {
  const [conversationTitle, setConversationTitle] = useState(initialTitle)

  return (
    <ChatConversationTitleContext.Provider
      value={{ conversationTitle, setConversationTitle }}
    >
      {children}
    </ChatConversationTitleContext.Provider>
  )
}

/** Reads and updates active conversation title state. */
export function useChatConversationTitle() {
  const context = useContext(ChatConversationTitleContext)

  if (!context) {
    throw new Error(
      "Chat conversation title context is missing its provider."
    )
  }

  return context
}

/** Renders active conversation title after local rename changes. */
export function ChatConversationTitle({
  className,
  ...props
}: Omit<ComponentProps<"p">, "children">) {
  const { conversationTitle } = useChatConversationTitle()

  return (
    <p className={cn("truncate text-sm", className)} {...props}>
      {conversationTitle}
    </p>
  )
}
