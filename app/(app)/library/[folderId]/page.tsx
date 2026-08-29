import type { Metadata } from "next"
import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  LibraryPageContent,
  LibraryPageContentSkeleton,
} from "@/features/library/components/library-page-content"

export const metadata: Metadata = {
  title: "Folder – AI Chat",
}

/** Composes one owner-scoped Library Folder from resolved route ID. */
export default function LibraryFolderPage({
  params,
}: PageProps<"/library/[folderId]">) {
  return (
    <ErrorBoundary title="Folder did not load">
      <Suspense fallback={<LibraryPageContentSkeleton />}>
        {params.then(({ folderId }) => (
          <LibraryPageContent folderId={folderId} />
        ))}
      </Suspense>
    </ErrorBoundary>
  )
}
