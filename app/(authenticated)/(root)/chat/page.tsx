import { Suspense } from "react";

import { AppRouteShell } from "@/components/app-route-shell";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  ChatPageContentSkeleton,
  NewChatPageContent,
} from "@/features/chat/components/chat-page-content";

/** Composes authenticated blank chat page. */
export default function ChatPage() {
  return (
    <AppRouteShell data-testid="chat-shell">
      <ErrorBoundary title="Chat did not load">
        <Suspense fallback={<ChatPageContentSkeleton />}>
          <NewChatPageContent />
        </Suspense>
      </ErrorBoundary>
    </AppRouteShell>
  );
}
