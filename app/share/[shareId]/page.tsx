import { Suspense } from "react";

import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  SharedChatContent,
  SharedChatContentSkeleton,
} from "@/features/chat/components/shared-chat-content";

/** Composes public read-only chat from resolved public-link token. */
export default function SharedChatPage({
  params,
}: PageProps<"/share/[shareId]">) {
  return (
    <div className="h-svh" data-testid="shared-chat-shell">
      <ErrorBoundary title="Shared chat did not load">
        <Suspense fallback={<SharedChatContentSkeleton />}>
          {params.then(({ shareId }) => (
            <SharedChatContent publicToken={shareId} />
          ))}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
