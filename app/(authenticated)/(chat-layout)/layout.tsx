import { Suspense } from "react";

import { AppSidebarFrame } from "@/components/app-sidebar-frame";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  AuthenticatedChatSidebar,
  AuthenticatedChatSidebarSkeleton,
} from "@/features/chat/components/authenticated-chat-sidebar";

/** Frames authenticated chat, project, and Library routes. */
export default function AuthenticatedAppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppSidebarFrame
      sidebar={
        <ErrorBoundary title="Navigation did not load" variant="sidebar">
          <Suspense fallback={<AuthenticatedChatSidebarSkeleton />}>
            <AuthenticatedChatSidebar />
          </Suspense>
        </ErrorBoundary>
      }
    >
      {children}
    </AppSidebarFrame>
  );
}
