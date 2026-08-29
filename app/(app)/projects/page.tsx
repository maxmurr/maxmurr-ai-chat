import type { Metadata } from "next"

import { ChatPageHeader } from "@/features/chat/components/chat-page-header"
import { ProjectsList } from "@/features/project/components/projects-list"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Projects – AI Chat",
}

/** Renders searchable workspace project index. */
export default function ProjectsPage() {
  return (
    <>
      <ChatPageHeader>
        <p className="text-sm font-medium">Projects</p>
      </ChatPageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ProjectsList />
      </div>
    </>
  )
}
