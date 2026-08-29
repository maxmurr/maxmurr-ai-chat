import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { loadChatPageData } from "@/app/chat/chat-page-data"
import { ChatAppShell } from "@/components/chat/chat-app-shell"
import { ChatPageHeader } from "@/components/chat/chat-page-header"
import { LibraryBrowser } from "@/components/library/library-browser"
import { createLibraryBrowserItems } from "@/components/library/library-data"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"
import {
  InvalidLibraryRequestError,
  LibraryAccessDeniedError,
} from "@/src/entities/errors/library-errors"

export const metadata: Metadata = {
  title: "Folder – AI Chat",
}

/** Renders one owner-scoped flat Library Folder at bookmarkable URL. */
export default async function LibraryFolderPage(
  props: PageProps<"/library/[folderId]">
) {
  const { folderId } = await props.params
  const {
    activeWorkspaceId,
    currentUser,
    ownChats,
    teamChats,
    userId,
    workspaces,
  } = await loadChatPageData()
  const libraryController = resolveApplicationDependency(
    applicationInjectionTokens.libraryController
  )
  let listing

  try {
    listing = await libraryController.listLibrary(folderId, {
      organizationId: activeWorkspaceId,
      ownerId: userId,
    })
  } catch (error) {
    if (
      error instanceof InvalidLibraryRequestError ||
      error instanceof LibraryAccessDeniedError
    ) {
      notFound()
    }

    throw error
  }

  if (!listing.folder) {
    notFound()
  }

  const items = createLibraryBrowserItems([], listing.files, false)
  const folders = listing.folders.map(({ id, name }) => ({ id, name }))

  return (
    <ChatAppShell
      activeNavigation="library"
      activeWorkspaceId={activeWorkspaceId}
      currentUser={currentUser}
      initialTitle={listing.folder.name}
      ownChats={ownChats}
      teamChats={teamChats}
      workspaces={workspaces}
    >
      <ChatPageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/library" />}>
                Library
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{listing.folder.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </ChatPageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <LibraryBrowser
          activeFolderId={listing.folder.id}
          currentFolderName={listing.folder.name}
          folders={folders}
          items={items}
        />
      </div>
    </ChatAppShell>
  )
}
