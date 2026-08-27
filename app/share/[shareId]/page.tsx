import { notFound } from "next/navigation"

import { ChatTranscript } from "@/components/chat/chat-transcript"
import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"
import type { ChatUIMessage } from "@/src/interface-adapters/presenters/chat-message.presenter"

/** Renders a publicly shared chat read-only, without authentication. */
export default async function SharedChatPage(
  props: PageProps<"/share/[shareId]">
) {
  const { shareId } = await props.params
  const chatLibrary = resolveApplicationDependency(
    applicationInjectionTokens.chatLibraryController
  )
  const view = await chatLibrary.getPublicChat(shareId)

  if (!view) {
    notFound()
  }

  return (
    <main className="flex h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <p className="min-w-0 flex-1 truncate text-base sm:text-sm">
          {view.chat.title}
        </p>
        <p className="shrink-0 text-xs text-muted-foreground">Shared chat</p>
      </header>
      <ChatTranscript
        messages={view.messages as ChatUIMessage[]}
        title={view.chat.title}
      />
    </main>
  )
}
