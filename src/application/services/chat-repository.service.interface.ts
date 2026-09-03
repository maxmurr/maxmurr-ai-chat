import type {
  Chat,
  ChatMessage,
  ChatSidebarEntry,
  ChatVisibility,
} from "@/src/entities/models/chat";

/** Persists chats and their messages behind the infrastructure boundary. */
export type ChatRepository = {
  claimChatResponseStream(chatId: string, streamId: string): Promise<boolean>;
  createChat(chat: {
    id: string;
    organizationId: string;
    ownerId: string;
    projectId: string | null;
    title: string;
  }): Promise<Chat>;
  deleteChat(chatId: string): Promise<boolean>;
  deleteMessagesFrom(
    chatId: string,
    pivot: { messageId: string; inclusive: boolean }
  ): Promise<void>;
  findWorkspaceMemberByEmail(
    email: string,
    organizationId?: string
  ): Promise<{ organizationId: string; userId: string } | null>;
  finishChatResponseStream(
    chatId: string,
    streamId: string,
    hasUnreadResponse: boolean
  ): Promise<void>;
  getChatById(chatId: string): Promise<Chat | null>;
  getChatByPublicToken(publicToken: string): Promise<Chat | null>;
  getChatMessages(chatId: string): Promise<ChatMessage[]>;
  isWorkspaceMember(organizationId: string, userId: string): Promise<boolean>;
  listChatsByProject(projectId: string): Promise<Chat[]>;
  listOwnChats(
    organizationId: string,
    ownerId: string
  ): Promise<ChatSidebarEntry[]>;
  listTeamChats(
    organizationId: string,
    excludedOwnerId: string
  ): Promise<Chat[]>;
  markChatRead(chatId: string, assistantMessageId: string): Promise<void>;
  saveMessage(chatId: string, message: ChatMessage): Promise<void>;
  saveMessageIfAbsent(chatId: string, message: ChatMessage): Promise<void>;
  updateChatPinned(chatId: string, pinned: boolean): Promise<void>;
  updateChatProject(chatId: string, projectId: string | null): Promise<void>;
  updateChatSharing(
    chatId: string,
    sharing: { publicToken: string | null; visibility: ChatVisibility }
  ): Promise<void>;
  updateChatTitle(chatId: string, title: string): Promise<void>;
};
