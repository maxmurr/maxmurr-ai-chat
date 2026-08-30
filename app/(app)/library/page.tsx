import type { Metadata } from "next";
import { Suspense } from "react";

import { AppRouteShell } from "@/components/app-route-shell";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  LibraryPageContent,
  LibraryPageContentSkeleton,
} from "@/features/library/components/library-page-content";

export const metadata: Metadata = {
  title: "Library – AI Chat",
};

/** Composes authenticated Library root. */
export default function LibraryPage() {
  return (
    <AppRouteShell data-testid="library-shell">
      <ErrorBoundary title="Library did not load">
        <Suspense fallback={<LibraryPageContentSkeleton />}>
          <LibraryPageContent />
        </Suspense>
      </ErrorBoundary>
    </AppRouteShell>
  );
}
