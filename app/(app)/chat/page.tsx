import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  ChatPageContentSkeleton,
  NewChatPageContent,
} from "@/features/chat/components/chat-page-content"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Composes authenticated blank chat page. */
export default function ChatPage() {
  return (
    <ErrorBoundary title="Chat did not load">
      <Suspense fallback={<ChatPageContentSkeleton />}>
        <NewChatPageContent />
      </Suspense>
    </ErrorBoundary>
  )
}
