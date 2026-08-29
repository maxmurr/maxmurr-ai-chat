import Link from "next/link";

import { ChatPageHeader } from "@/features/chat/components/chat-page-header";
import { LibraryBrowser } from "@/features/library/components/library-browser";
import { createLibraryBrowserItems } from "@/features/library/components/library-data";
import { getLibraryPageListing } from "@/features/library/library-queries";
import { AppPageContainer } from "@/components/app-page-container";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

/** Loads owner-scoped Library root or Folder browser. */
export async function LibraryPageContent({
  folderId = null,
}: {
  folderId?: string | null;
}) {
  const listing = await getLibraryPageListing(folderId);
  const currentFolder = listing.folder;
  const items = createLibraryBrowserItems(
    currentFolder ? [] : listing.folders,
    listing.files,
    !currentFolder
  );
  const folders = listing.folders.map(({ id, name }) => ({ id, name }));

  return (
    <>
      <ChatPageHeader data-testid="library-content">
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
  );
}

/** Reserves Library header, controls, and item grid while data loads. */
export function LibraryPageContentSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Library"
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <ChatPageHeader>
        <Skeleton className="h-5 w-28 max-w-full sm:h-4" />
      </ChatPageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AppPageContainer className="mx-auto">
          <div className="mb-6 flex min-w-0 items-center gap-2">
            <Skeleton className="h-11 max-w-xs min-w-0 flex-1 sm:h-8" />
            <Skeleton className="ml-auto h-11 w-16 shrink-0 sm:h-8" />
          </div>
          <div className="mb-4 flex min-w-0 items-center gap-2 overflow-hidden">
            <Skeleton className="h-11 w-14 shrink-0 sm:h-8" />
            <Skeleton className="h-11 w-20 shrink-0 sm:h-8" />
            <Skeleton className="h-11 w-24 shrink-0 sm:h-8" />
            <Skeleton className="ml-auto h-11 w-20 shrink-0 sm:h-8" />
          </div>
          <div className="grid grid-cols-2 gap-3 @lg:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-5 @6xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton className="aspect-4/5-full min-w-0" key={index} />
            ))}
          </div>
        </AppPageContainer>
      </div>
    </div>
  );
}
