import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";

import { appDatabase } from "@/drizzle/app-database";
import { chat, chatMessage, member, project, user } from "@/drizzle/app-schema";
import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type {
  Chat,
  ChatMessage,
  ChatVisibility,
} from "@/src/entities/models/chat";

const CHAT_LIST_LIMIT = 100;

function toChat(row: typeof chat.$inferSelect): Chat {
  return {
    activeStreamId: row.activeStreamId,
    createdAt: row.createdAt,
    hasUnreadResponse: row.hasUnreadResponse,
    id: row.id,
    organizationId: row.organizationId,
    ownerId: row.ownerId,
    pinned: row.pinned,
    projectId: row.projectId,
    publicToken: row.publicToken,
    title: row.title,
    updatedAt: row.updatedAt,
    visibility: row.visibility as ChatVisibility,
  };
}

function toChatMessage(row: typeof chatMessage.$inferSelect): ChatMessage {
  const metadata =
    typeof row.metadata === "object" && row.metadata !== null
      ? row.metadata
      : {};

  return {
    id: row.id,
    metadata: { ...metadata, createdAt: row.createdAt.toISOString() },
    parts: row.parts as readonly unknown[],
    role: row.role as ChatMessage["role"],
  };
}

/** Drizzle-backed chat persistence for the app PostgreSQL database. */
export const drizzleChatRepository: ChatRepository = {
  async claimChatResponseStream(chatId, streamId) {
    const rows = await appDatabase
      .update(chat)
      .set({
        activeStreamId: streamId,
        hasUnreadResponse: false,
        updatedAt: new Date(),
      })
      .where(and(eq(chat.id, chatId), isNull(chat.activeStreamId)))
      .returning({ id: chat.id });
    return rows.length === 1;
  },

  async createChat(newChat) {
    const [row] = await appDatabase.insert(chat).values(newChat).returning();
    return toChat(row);
  },

  async deleteChat(chatId) {
    const rows = await appDatabase
      .delete(chat)
      .where(and(eq(chat.id, chatId), isNull(chat.activeStreamId)))
      .returning({ id: chat.id });
    return rows.length === 1;
  },

  async deleteOwnedChats(chatIds, scope) {
    if (chatIds.length === 0) {
      return [];
    }

    const rows = await appDatabase
      .delete(chat)
      .where(
        and(
          inArray(chat.id, chatIds),
          eq(chat.organizationId, scope.organizationId),
          eq(chat.ownerId, scope.ownerId),
          isNull(chat.activeStreamId)
        )
      )
      .returning({ id: chat.id });
    return rows.map(({ id }) => id);
  },

  async deleteMessagesFrom(chatId, pivot) {
    const [pivotRow] = await appDatabase
      .select({ createdAt: chatMessage.createdAt })
      .from(chatMessage)
      .where(
        and(eq(chatMessage.chatId, chatId), eq(chatMessage.id, pivot.messageId))
      );

    if (!pivotRow) {
      return;
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
      );
  },

  async findWorkspaceMemberByEmail(email, organizationId) {
    const [row] = await appDatabase
      .select({ organizationId: member.organizationId, userId: member.userId })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(
        and(
          eq(sql`lower(${user.email})`, email.toLowerCase()),
          organizationId ? eq(member.organizationId, organizationId) : undefined
        )
      )
      .orderBy(asc(member.createdAt))
      .limit(1);
    return row ?? null;
  },

  async finishChatResponseStream(chatId, streamId, hasUnreadResponse) {
    await appDatabase
      .update(chat)
      .set({ activeStreamId: null, hasUnreadResponse })
      .where(and(eq(chat.id, chatId), eq(chat.activeStreamId, streamId)));
  },

  async getChatById(chatId) {
    const [row] = await appDatabase
      .select()
      .from(chat)
      .where(eq(chat.id, chatId));
    return row ? toChat(row) : null;
  },

  async getChatByPublicToken(publicToken) {
    const [row] = await appDatabase
      .select()
      .from(chat)
      .where(
        and(eq(chat.publicToken, publicToken), eq(chat.visibility, "public"))
      );
    return row ? toChat(row) : null;
  },

  async getChatMessages(chatId) {
    const rows = await appDatabase
      .select()
      .from(chatMessage)
      .where(eq(chatMessage.chatId, chatId))
      .orderBy(asc(chatMessage.createdAt), asc(chatMessage.id));
    return rows.map(toChatMessage);
  },

  async isWorkspaceMember(organizationId, userId) {
    const [row] = await appDatabase
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(member.userId, userId)
        )
      );
    return row !== undefined;
  },

  async listChatsByProject(projectId) {
    const rows = await appDatabase
      .select()
      .from(chat)
      .where(eq(chat.projectId, projectId))
      .orderBy(desc(chat.updatedAt));
    return rows.map(toChat);
  },

  async listOwnChatsPage({
    cursor,
    filter,
    limit,
    organizationId,
    ownerId,
    query,
  }) {
    const normalizedQuery = query.toLowerCase();
    // ponytail: text-part scan keeps schema simple; add a tsvector/GIN index when measured search latency warrants it.
    const matchingMessageContent =
      normalizedQuery.length > 0
        ? sql<boolean>`exists (
            select 1
            from ${chatMessage}, jsonb_array_elements(${chatMessage.parts}) as searched_part
            where ${chatMessage.chatId} = ${chat.id}
              and searched_part->>'type' = 'text'
              and position(${normalizedQuery} in lower(coalesce(searched_part->>'text', ''))) > 0
          )`
        : undefined;
    const searchFilter =
      normalizedQuery.length > 0
        ? or(
            sql<boolean>`position(${normalizedQuery} in lower(${chat.title})) > 0`,
            matchingMessageContent
          )
        : undefined;
    const cursorFilter = cursor
      ? or(
          lt(chat.updatedAt, cursor.updatedAt),
          and(eq(chat.updatedAt, cursor.updatedAt), lt(chat.id, cursor.id))
        )
      : undefined;
    const stateFilter =
      filter === "pinned"
        ? eq(chat.pinned, true)
        : filter === "unread"
          ? eq(chat.hasUnreadResponse, true)
          : undefined;
    const searchSnippet =
      normalizedQuery.length > 0
        ? sql<string | null>`(
            select substring(
              coalesce(searched_part->>'text', '')
              from greatest(
                position(${normalizedQuery} in lower(coalesce(searched_part->>'text', ''))) - 72,
                1
              )
              for 200
            )
            from ${chatMessage}, jsonb_array_elements(${chatMessage.parts}) as searched_part
            where ${chatMessage.chatId} = ${chat.id}
              and searched_part->>'type' = 'text'
              and position(${normalizedQuery} in lower(coalesce(searched_part->>'text', ''))) > 0
            order by ${chatMessage.createdAt} desc, ${chatMessage.id} desc
            limit 1
          )`
        : sql<string | null>`null`;
    const rows = await appDatabase
      .select({ chat, projectName: project.name, searchSnippet })
      .from(chat)
      .leftJoin(project, eq(chat.projectId, project.id))
      .where(
        and(
          eq(chat.organizationId, organizationId),
          eq(chat.ownerId, ownerId),
          cursorFilter,
          stateFilter,
          searchFilter
        )
      )
      .orderBy(desc(chat.updatedAt), desc(chat.id))
      .limit(limit + 1);
    const pageRows = rows.slice(0, limit);
    const lastRow = pageRows.at(-1);

    return {
      chats: pageRows.map((row) => ({
        ...toChat(row.chat),
        projectName: row.projectName,
        searchSnippet: row.searchSnippet?.replace(/\s+/g, " ").trim() || null,
      })),
      nextCursor:
        rows.length > limit && lastRow
          ? { id: lastRow.chat.id, updatedAt: lastRow.chat.updatedAt }
          : null,
    };
  },

  async listOwnChats(organizationId, ownerId) {
    const ownerFilter = and(
      eq(chat.organizationId, organizationId),
      eq(chat.ownerId, ownerId)
    );
    // Keep every pinned Project Chat even when it falls outside sidebar cap.
    const [limitedRows, pinnedProjectRows] = await Promise.all([
      appDatabase
        .select({ chat, projectName: project.name })
        .from(chat)
        .leftJoin(project, eq(chat.projectId, project.id))
        .where(
          and(
            ownerFilter,
            or(isNull(project.pinned), eq(project.pinned, false))
          )
        )
        .orderBy(desc(chat.pinned), desc(chat.updatedAt))
        .limit(CHAT_LIST_LIMIT),
      appDatabase
        .select({ chat, projectName: project.name })
        .from(chat)
        .innerJoin(project, eq(chat.projectId, project.id))
        .where(and(ownerFilter, eq(project.pinned, true)))
        .orderBy(desc(chat.updatedAt)),
    ]);
    const rowsByChatId = new Map(
      [...limitedRows, ...pinnedProjectRows].map((row) => [row.chat.id, row])
    );
    return [...rowsByChatId.values()].map((row) => ({
      ...toChat(row.chat),
      projectName: row.projectName,
    }));
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
      .limit(CHAT_LIST_LIMIT);
    return rows.map(toChat);
  },

  async markChatRead(chatId, assistantMessageId) {
    await appDatabase
      .update(chat)
      .set({
        hasUnreadResponse: false,
        updatedAt: sql`${chat.updatedAt}`,
      })
      .where(
        and(
          eq(chat.id, chatId),
          isNull(chat.activeStreamId),
          sql`${assistantMessageId} = (
            SELECT ${chatMessage.id}
            FROM ${chatMessage}
            WHERE ${chatMessage.chatId} = ${chat.id}
              AND ${chatMessage.role} = 'assistant'
            ORDER BY ${chatMessage.createdAt} DESC, ${chatMessage.id} DESC
            LIMIT 1
          )`
        )
      );
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
      });
    await appDatabase
      .update(chat)
      .set({ updatedAt: new Date() })
      .where(eq(chat.id, chatId));
  },

  async saveMessageIfAbsent(chatId, message) {
    await appDatabase
      .insert(chatMessage)
      .values({
        chatId,
        id: message.id,
        metadata: message.metadata ?? null,
        parts: message.parts,
        role: message.role,
      })
      .onConflictDoNothing({ target: [chatMessage.chatId, chatMessage.id] });
  },

  async updateChatPinned(chatId, pinned) {
    await appDatabase.update(chat).set({ pinned }).where(eq(chat.id, chatId));
  },

  async updateChatProject(chatId, projectId) {
    await appDatabase
      .update(chat)
      .set({ projectId })
      .where(eq(chat.id, chatId));
  },

  async updateChatSharing(chatId, sharing) {
    await appDatabase.update(chat).set(sharing).where(eq(chat.id, chatId));
  },

  async updateChatTitle(chatId, title) {
    await appDatabase.update(chat).set({ title }).where(eq(chat.id, chatId));
  },
};
