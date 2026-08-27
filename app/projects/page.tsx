import type { Metadata } from "next"

import { ChatPageHeader } from "@/components/chat/chat-page-header"
import { ProjectsList } from "@/components/projects/projects-list"

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
