import type { Metadata } from "next";
import { Suspense } from "react";

import { AppPageHeader } from "@/components/app-page-header";
import { AppRouteShell } from "@/components/app-route-shell";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  ChatsList,
  ChatsListSkeleton,
} from "@/features/chat/components/chats-list";

export const metadata: Metadata = {
  title: "Chats – AI Chat",
};

/** Renders searchable owner Chat index. */
export default function ChatsPage() {
  return (
    <AppRouteShell data-testid="chats-shell">
      <AppPageHeader>
        <h1 className="text-sm font-medium" data-testid="chats-index-content">
          Chats
        </h1>
      </AppPageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ErrorBoundary title="Chats did not load">
          <Suspense fallback={<ChatsListSkeleton />}>
            <ChatsList />
          </Suspense>
        </ErrorBoundary>
      </div>
    </AppRouteShell>
  );
}
