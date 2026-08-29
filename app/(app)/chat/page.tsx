import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  ChatPageContentSkeleton,
  NewChatPageContent,
} from "@/features/chat/components/chat-page-content"

/** Composes authenticated blank chat page. */
export default function ChatPage() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-testid="chat-shell"
    >
      <ErrorBoundary title="Chat did not load">
        <Suspense fallback={<ChatPageContentSkeleton />}>
          <NewChatPageContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
