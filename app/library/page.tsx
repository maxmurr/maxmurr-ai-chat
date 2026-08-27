import type { Metadata } from "next"

import { loadChatPageData } from "@/app/chat/chat-page-data"
import { ChatAppShell } from "@/components/chat/chat-app-shell"
import { ChatPageHeader } from "@/components/chat/chat-page-header"
import { LibraryBrowser } from "@/components/library/library-browser"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

export const metadata: Metadata = {
  title: "Library – AI Chat",
}

/** Renders authenticated workspace library. */
export default async function LibraryPage() {
  const { activeWorkspaceId, currentUser, ownChats, teamChats, workspaces } =
    await loadChatPageData()

  return (
    <ChatAppShell
      activeNavigation="library"
      activeWorkspaceId={activeWorkspaceId}
      currentUser={currentUser}
      initialTitle="Library"
      ownChats={ownChats}
      teamChats={teamChats}
      workspaces={workspaces}
    >
      <ChatPageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Library</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </ChatPageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <LibraryBrowser />
      </div>
    </ChatAppShell>
  )
}
