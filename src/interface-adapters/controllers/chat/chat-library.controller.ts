import { z } from "zod"

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface"
import {
  ChatAccessDeniedError,
  InvalidChatRequestError,
} from "@/src/entities/errors/chat-errors"
import {
  canViewChat,
  chatVisibilities,
  type Chat,
} from "@/src/entities/models/chat"

const chatTitleSchema = z.string().trim().min(1).max(80)
const chatVisibilitySchema = z.enum(chatVisibilities)

function withoutPublicToken(chat: Chat): Chat {
  return { ...chat, publicToken: null }
}

/** Validated chat library controller resolved by application composition root. */
export type ChatLibraryController = ReturnType<
  typeof createChatLibraryController
>

/** Creates owner-scoped chat read and management operations over the repository. */
export function createChatLibraryController(chatRepository: ChatRepository) {
  async function requireOwnedChat(chatId: string, userId: string) {
    const chat = await chatRepository.getChatById(chatId)

    if (!chat || chat.ownerId !== userId) {
      throw new ChatAccessDeniedError()
    }

    return chat
  }

  return {
    async deleteChat(chatId: string, userId: string) {
      await requireOwnedChat(chatId, userId)
      await chatRepository.deleteChat(chatId)
    },

    /** Returns the chat as seen by this user, or null when it must stay hidden. */
    async getChatForViewer(chatId: string, userId: string) {
      const chat = await chatRepository.getChatById(chatId)

      if (!chat) {
        return null
      }

      const isOwner = chat.ownerId === userId
      const isWorkspaceMember =
        isOwner ||
        (await chatRepository.isWorkspaceMember(chat.organizationId, userId))

      if (!canViewChat(chat, { isWorkspaceMember, userId })) {
        return null
      }

      return {
        chat: isOwner ? chat : withoutPublicToken(chat),
        isOwner,
        messages: await chatRepository.getChatMessages(chatId),
      }
    },

    async getPublicChat(publicToken: string) {
      const chat = await chatRepository.getChatByPublicToken(publicToken)

      if (!chat) {
        return null
      }

      return {
        chat: withoutPublicToken(chat),
        messages: await chatRepository.getChatMessages(chat.id),
      }
    },

    async listSidebarChats(organizationId: string, userId: string) {
      const [ownChats, teamChats] = await Promise.all([
        chatRepository.listOwnChats(organizationId, userId),
        chatRepository.listTeamChats(organizationId, userId),
      ])
      return { ownChats, teamChats }
    },

    async renameChat(chatId: string, userId: string, title: unknown) {
      const result = chatTitleSchema.safeParse(title)

      if (!result.success) {
        throw new InvalidChatRequestError({ cause: result.error })
      }

      await requireOwnedChat(chatId, userId)
      await chatRepository.updateChatTitle(chatId, result.data)
    },

    /** Sets visibility; the public token exists exactly while the chat is public. */
    async updateChatSharing(chatId: string, userId: string, visibility: unknown) {
      const result = chatVisibilitySchema.safeParse(visibility)

      if (!result.success) {
        throw new InvalidChatRequestError({ cause: result.error })
      }

      const chat = await requireOwnedChat(chatId, userId)
      const publicToken =
        result.data === "public"
          ? (chat.publicToken ?? crypto.randomUUID())
          : null

      await chatRepository.updateChatSharing(chatId, {
        publicToken,
        visibility: result.data,
      })

      return { publicToken, visibility: result.data }
    },
  }
}
