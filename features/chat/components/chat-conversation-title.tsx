"use client";

import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

import { useOptimisticChatEntry } from "@/features/chat/hooks/use-optimistic-chat-list";
import { cn } from "@/lib/utils";

type ChatConversationTitleContextValue = {
  conversationTitle: string;
  setConversationTitle: (conversationTitle: string) => void;
};

const ChatConversationTitleContext =
  createContext<ChatConversationTitleContextValue | null>(null);

/** Shares active conversation title state between isolated client controls. */
export function ChatConversationTitleProvider({
  chatId,
  children,
  initialTitle,
  isChatPersisted,
}: {
  chatId: string;
  children: ReactNode;
  initialTitle: string;
  isChatPersisted: boolean;
}) {
  const [localConversationTitle, setConversationTitle] = useState(initialTitle);
  const { title: conversationTitle } = useOptimisticChatEntry({
    id: chatId,
    title: isChatPersisted ? initialTitle : localConversationTitle,
  });

  return (
    <ChatConversationTitleContext.Provider
      value={{ conversationTitle, setConversationTitle }}
    >
      {children}
    </ChatConversationTitleContext.Provider>
  );
}

/** Reads and updates active conversation title state. */
export function useChatConversationTitle() {
  const context = useContext(ChatConversationTitleContext);

  if (!context) {
    throw new Error("Chat conversation title context is missing its provider.");
  }

  return context;
}

/** Renders active conversation title after local rename changes. */
export function ChatConversationTitle({
  className,
  ...props
}: Omit<ComponentProps<"p">, "children">) {
  const { conversationTitle } = useChatConversationTitle();

  return (
    <p className={cn("truncate text-base sm:text-sm", className)} {...props}>
      {conversationTitle}
    </p>
  );
}
