import type { Metadata } from "next"
import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  LibraryPageContent,
  LibraryPageContentSkeleton,
} from "@/features/library/components/library-page-content"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Library – AI Chat",
}

/** Composes authenticated Library root. */
export default function LibraryPage() {
  return (
    <ErrorBoundary title="Library did not load">
      <Suspense fallback={<LibraryPageContentSkeleton />}>
        <LibraryPageContent />
      </Suspense>
    </ErrorBoundary>
  )
}
