import type { Metadata } from "next"
import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  LibraryPageContent,
  LibraryPageContentSkeleton,
} from "@/features/library/components/library-page-content"

export const metadata: Metadata = {
  title: "Library – AI Chat",
}

/** Composes authenticated Library root. */
export default function LibraryPage() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-testid="library-shell"
    >
      <ErrorBoundary title="Library did not load">
        <Suspense fallback={<LibraryPageContentSkeleton />}>
          <LibraryPageContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
