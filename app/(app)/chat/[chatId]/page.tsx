import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  ChatByIdPageContent,
  ChatPageContentSkeleton,
} from "@/features/chat/components/chat-page-content"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
