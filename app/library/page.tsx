import type { Metadata } from "next"

import { loadChatPageData } from "@/app/chat/chat-page-data"
import { ChatAppSidebar } from "@/components/chat/chat-app-sidebar"
import { ChatConversationTitleProvider } from "@/components/chat/chat-conversation-title"
import { LibraryBrowser } from "@/components/library/library-browser"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export const metadata: Metadata = {
  title: "Library – AI Chat",
}

/** Renders authenticated workspace library. */
export default async function LibraryPage() {
  const { activeWorkspaceId, currentUser, ownChats, teamChats, workspaces } =
    await loadChatPageData()

  return (
    <ChatConversationTitleProvider initialTitle="Library">
      <SidebarProvider className="isolate h-svh">
        <ChatAppSidebar
          activeNavigation="library"
          activeWorkspaceId={activeWorkspaceId}
          currentUser={currentUser}
          ownChats={ownChats}
          teamChats={teamChats}
          workspaces={workspaces}
        />
        <SidebarInset id="main-content" className="min-w-0 overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
              <SidebarTrigger aria-label="Toggle sidebar" />
              <Separator
                className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                orientation="vertical"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Library</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <LibraryBrowser />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ChatConversationTitleProvider>
  )
}
