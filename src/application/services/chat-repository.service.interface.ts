import type {
  Chat,
  ChatMessage,
  ChatVisibility,
} from "@/src/entities/models/chat"

/** Persists chats and their messages behind the infrastructure boundary. */
export type ChatRepository = {
  createChat(chat: {
    id: string
    organizationId: string
    ownerId: string
    title: string
  }): Promise<Chat>
  deleteChat(chatId: string): Promise<void>
  deleteMessagesFrom(
    chatId: string,
    pivot: { messageId: string; inclusive: boolean }
  ): Promise<void>
  getChatById(chatId: string): Promise<Chat | null>
  getChatByPublicToken(publicToken: string): Promise<Chat | null>
  getChatMessages(chatId: string): Promise<ChatMessage[]>
  isWorkspaceMember(organizationId: string, userId: string): Promise<boolean>
  listOwnChats(organizationId: string, ownerId: string): Promise<Chat[]>
  listTeamChats(
    organizationId: string,
    excludedOwnerId: string
  ): Promise<Chat[]>
  saveMessage(chatId: string, message: ChatMessage): Promise<void>
  updateChatSharing(
    chatId: string,
    sharing: { publicToken: string | null; visibility: ChatVisibility }
  ): Promise<void>
  updateChatTitle(chatId: string, title: string): Promise<void>
}
