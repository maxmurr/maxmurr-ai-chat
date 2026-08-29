"use server"

import { refresh } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"
import { auth } from "@/di/authentication"
import type { ChatVisibility } from "@/src/entities/models/chat"

const chatIdSchema = z.uuid()

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/sign-in")
  }

  return session.user.id
}

function chatLibrary() {
  return resolveApplicationDependency(
    applicationInjectionTokens.chatLibraryController
  )
}

/** Sets who can see a chat and returns the public token when one exists. */
export async function updateChatSharingAction(
  chatId: unknown,
  visibility: ChatVisibility
): Promise<
  | { ok: true; publicToken: string | null; visibility: ChatVisibility }
  | { error: string; ok: false }
> {
  const parsedChatId = chatIdSchema.safeParse(chatId)

  if (!parsedChatId.success) {
    return { error: "Send a message first, then share the chat.", ok: false }
  }

  const userId = await requireUserId()

  try {
    const sharing = await chatLibrary().updateChatSharing(
      parsedChatId.data,
      userId,
      visibility
    )
    refresh()
    return { ok: true, ...sharing }
  } catch {
    return { error: "Send a message first, then share the chat.", ok: false }
  }
}

/** Sets owner chat pin after validating action input. */
export async function pinChatAction(chatId: unknown, pinned: unknown) {
  const parsedChatId = chatIdSchema.safeParse(chatId)

  if (!parsedChatId.success || typeof pinned !== "boolean") {
    return { error: "Could not update pin.", ok: false as const }
  }

  const userId = await requireUserId()

  try {
    await chatLibrary().pinChat(parsedChatId.data, userId, pinned)
    refresh()
    return { ok: true as const }
  } catch {
    return { error: "Could not update pin.", ok: false as const }
  }
}

/** Renames owner chat after validating chat identity and title in controller. */
export async function renameChatAction(chatId: unknown, title: unknown) {
  const parsedChatId = chatIdSchema.safeParse(chatId)

  if (!parsedChatId.success) {
    return { error: "Could not rename chat.", ok: false as const }
  }

  const userId = await requireUserId()

  try {
    await chatLibrary().renameChat(parsedChatId.data, userId, title)
    refresh()
    return { ok: true as const }
  } catch {
    return { error: "Could not rename chat.", ok: false as const }
  }
}

/** Deletes owner chat after validating chat identity. */
export async function deleteChatAction(chatId: unknown) {
  const parsedChatId = chatIdSchema.safeParse(chatId)

  if (!parsedChatId.success) {
    return { error: "Could not delete chat.", ok: false as const }
  }

  const userId = await requireUserId()

  try {
    await chatLibrary().deleteChat(parsedChatId.data, userId)
    refresh()
    return { ok: true as const }
  } catch {
    return { error: "Could not delete chat.", ok: false as const }
  }
}
