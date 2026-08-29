import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  SharedChatContent,
  SharedChatContentSkeleton,
} from "@/features/chat/components/shared-chat-content"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Composes public read-only chat from resolved public-link token. */
export default function SharedChatPage({
  params,
}: PageProps<"/share/[shareId]">) {
  return (
    <main className="flex h-svh flex-col">
      <ErrorBoundary title="Shared chat did not load">
        <Suspense fallback={<SharedChatContentSkeleton />}>
          {params.then(({ shareId }) => (
            <SharedChatContent publicToken={shareId} />
          ))}
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}
