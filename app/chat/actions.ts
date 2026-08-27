"use server"

import { refresh } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"
import { auth } from "@/di/authentication"
import type { ChatVisibility } from "@/src/entities/models/chat"

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
  chatId: string,
  visibility: ChatVisibility
): Promise<
  | { ok: true; publicToken: string | null; visibility: ChatVisibility }
  | { error: string; ok: false }
> {
  const userId = await requireUserId()

  try {
    const sharing = await chatLibrary().updateChatSharing(
      chatId,
      userId,
      visibility
    )
    refresh()
    return { ok: true, ...sharing }
  } catch {
    return { error: "Send a message first, then share the chat.", ok: false }
  }
}

export async function pinChatAction(chatId: string, pinned: boolean) {
  const userId = await requireUserId()

  try {
    await chatLibrary().pinChat(chatId, userId, pinned === true)
    refresh()
    return { ok: true as const }
  } catch {
    return { error: "Could not update pin.", ok: false as const }
  }
}

export async function renameChatAction(chatId: string, title: string) {
  const userId = await requireUserId()

  try {
    await chatLibrary().renameChat(chatId, userId, title)
    refresh()
    return { ok: true as const }
  } catch {
    return { error: "Could not rename chat.", ok: false as const }
  }
}

export async function deleteChatAction(chatId: string) {
  const userId = await requireUserId()

  try {
    await chatLibrary().deleteChat(chatId, userId)
    refresh()
    return { ok: true as const }
  } catch {
    return { error: "Could not delete chat.", ok: false as const }
  }
}
