import { and, asc, desc, eq, gt, ne, or, sql } from "drizzle-orm"

import { appDatabase } from "@/drizzle/app-database"
import { chat, chatMessage, member } from "@/drizzle/app-schema"
import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface"
import type {
  Chat,
  ChatMessage,
  ChatVisibility,
} from "@/src/entities/models/chat"

const CHAT_LIST_LIMIT = 100

function toChat(row: typeof chat.$inferSelect): Chat {
  return {
    createdAt: row.createdAt,
    id: row.id,
    organizationId: row.organizationId,
    ownerId: row.ownerId,
    pinned: row.pinned,
    publicToken: row.publicToken,
    title: row.title,
    updatedAt: row.updatedAt,
    visibility: row.visibility as ChatVisibility,
  }
}

function toChatMessage(row: typeof chatMessage.$inferSelect): ChatMessage {
  return {
    id: row.id,
    metadata: row.metadata ?? undefined,
    parts: row.parts as readonly unknown[],
    role: row.role as ChatMessage["role"],
  }
}

/** Drizzle-backed chat persistence for the app PostgreSQL database. */
export const drizzleChatRepository: ChatRepository = {
  async createChat(newChat) {
    const [row] = await appDatabase
      .insert(chat)
      .values(newChat)
      .returning()
    return toChat(row)
  },

  async deleteChat(chatId) {
    await appDatabase.delete(chat).where(eq(chat.id, chatId))
  },

  async deleteMessagesFrom(chatId, pivot) {
    const [pivotRow] = await appDatabase
      .select({ createdAt: chatMessage.createdAt })
      .from(chatMessage)
      .where(
        and(eq(chatMessage.chatId, chatId), eq(chatMessage.id, pivot.messageId))
      )

    if (!pivotRow) {
      return
    }

    await appDatabase
      .delete(chatMessage)
      .where(
        and(
          eq(chatMessage.chatId, chatId),
          or(
            gt(chatMessage.createdAt, pivotRow.createdAt),
            pivot.inclusive ? eq(chatMessage.id, pivot.messageId) : sql`false`
          )
        )
      )
  },

  async getChatById(chatId) {
    const [row] = await appDatabase
      .select()
      .from(chat)
      .where(eq(chat.id, chatId))
    return row ? toChat(row) : null
  },

  async getChatByPublicToken(publicToken) {
    const [row] = await appDatabase
      .select()
      .from(chat)
      .where(
        and(eq(chat.publicToken, publicToken), eq(chat.visibility, "public"))
      )
    return row ? toChat(row) : null
  },

  async getChatMessages(chatId) {
    const rows = await appDatabase
      .select()
      .from(chatMessage)
      .where(eq(chatMessage.chatId, chatId))
      .orderBy(asc(chatMessage.createdAt), asc(chatMessage.id))
    return rows.map(toChatMessage)
  },

  async isWorkspaceMember(organizationId, userId) {
    const [row] = await appDatabase
      .select({ id: member.id })
      .from(member)
      .where(
        and(eq(member.organizationId, organizationId), eq(member.userId, userId))
      )
    return row !== undefined
  },

  async listOwnChats(organizationId, ownerId) {
    const rows = await appDatabase
      .select()
      .from(chat)
      .where(
        and(eq(chat.organizationId, organizationId), eq(chat.ownerId, ownerId))
      )
      .orderBy(desc(chat.pinned), desc(chat.updatedAt))
      .limit(CHAT_LIST_LIMIT)
    return rows.map(toChat)
  },

  async listTeamChats(organizationId, excludedOwnerId) {
    const rows = await appDatabase
      .select()
      .from(chat)
      .where(
        and(
          eq(chat.organizationId, organizationId),
          ne(chat.ownerId, excludedOwnerId),
          ne(chat.visibility, "private")
        )
      )
      .orderBy(desc(chat.updatedAt))
      .limit(CHAT_LIST_LIMIT)
    return rows.map(toChat)
  },

  async saveMessage(chatId, message) {
    await appDatabase
      .insert(chatMessage)
      .values({
        chatId,
        id: message.id,
        metadata: message.metadata ?? null,
        parts: message.parts,
        role: message.role,
      })
      .onConflictDoUpdate({
        set: {
          metadata: message.metadata ?? null,
          parts: message.parts,
        },
        target: [chatMessage.chatId, chatMessage.id],
      })
    await appDatabase
      .update(chat)
      .set({ updatedAt: new Date() })
      .where(eq(chat.id, chatId))
  },

  async updateChatPinned(chatId, pinned) {
    await appDatabase.update(chat).set({ pinned }).where(eq(chat.id, chatId))
  },

  async updateChatSharing(chatId, sharing) {
    await appDatabase.update(chat).set(sharing).where(eq(chat.id, chatId))
  },

  async updateChatTitle(chatId, title) {
    await appDatabase.update(chat).set({ title }).where(eq(chat.id, chatId))
  },
}
