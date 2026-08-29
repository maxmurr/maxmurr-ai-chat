import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  ChatByIdPageContent,
  ChatPageContentSkeleton,
} from "@/features/chat/components/chat-page-content"

/** Composes one persisted chat from resolved route ID. */
export default function ChatByIdPage({
  params,
}: PageProps<"/chat/[chatId]">) {
  return (
    <ErrorBoundary title="Chat did not load">
      <Suspense fallback={<ChatPageContentSkeleton />}>
        {params.then(({ chatId }) => (
          <ChatByIdPageContent chatId={chatId} />
        ))}
      </Suspense>
    </ErrorBoundary>
  )
}
