import { notFound } from "next/navigation"

import { ChatPageShell } from "@/components/chat/chat-page-shell"
import { mockChatConversations } from "@/lib/mock-chat-conversations"

/** Lists mock thread IDs for build-time page generation. */
export function generateStaticParams() {
  return mockChatConversations.map(({ id }) => ({ threadId: id }))
}

/** Renders one mock chat selected by its stable thread ID. */
export default async function ChatThreadPage(
  props: PageProps<"/chat/[threadId]">
) {
  const { threadId } = await props.params
  const activeConversation = mockChatConversations.find(
    ({ id }) => id === threadId
  )

  if (!activeConversation) {
    notFound()
  }

  return <ChatPageShell activeConversation={activeConversation} />
}
