import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ChatAppFrame } from "@/features/chat/components/chat-app-shell"
import {
  AuthenticatedChatSidebar,
  AuthenticatedChatSidebarSkeleton,
} from "@/features/chat/components/authenticated-chat-sidebar"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Frames authenticated chat, project, and Library routes. */
export default function AuthenticatedAppLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <ChatAppFrame
      sidebar={
        <ErrorBoundary title="Navigation did not load" variant="sidebar">
          <Suspense fallback={<AuthenticatedChatSidebarSkeleton />}>
            <AuthenticatedChatSidebar />
          </Suspense>
        </ErrorBoundary>
      }
    >
      {children}
    </ChatAppFrame>
  )
}
