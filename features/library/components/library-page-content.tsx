import Link from "next/link"

import { ChatPageHeader } from "@/features/chat/components/chat-page-header"
import { LibraryBrowser } from "@/features/library/components/library-browser"
import { createLibraryBrowserItems } from "@/features/library/components/library-data"
import { getLibraryPageListing } from "@/features/library/library-queries"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"

/** Loads owner-scoped Library root or Folder browser. */
export async function LibraryPageContent({
  folderId = null,
}: {
  folderId?: string | null
}) {
  const listing = await getLibraryPageListing(folderId)
  const currentFolder = listing.folder
  const items = createLibraryBrowserItems(
    currentFolder ? [] : listing.folders,
    listing.files,
    !currentFolder
  )
  const folders = listing.folders.map(({ id, name }) => ({ id, name }))

  return (
    <>
      <ChatPageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            {currentFolder ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href="/library" />}>
                    Library
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentFolder.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage>Library</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </ChatPageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <LibraryBrowser
          activeFolderId={currentFolder?.id}
          currentFolderName={currentFolder?.name}
          folders={folders}
          items={items}
        />
      </div>
    </>
  )
}

/** Reserves Library header, controls, and item grid while data loads. */
export function LibraryPageContentSkeleton() {
  return (
    <>
      <ChatPageHeader>
        <Skeleton className="h-4 w-28" />
      </ChatPageHeader>
      <div className="mx-auto grid w-full max-w-7xl gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton className="h-24 w-full" key={index} />
        ))}
      </div>
    </>
  )
}
