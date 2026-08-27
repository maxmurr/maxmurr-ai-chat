import type { Metadata } from "next"

import { ProjectsList } from "@/components/projects/projects-list"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export const metadata: Metadata = {
  title: "Projects – AI Chat",
}

/** Renders searchable workspace project index. */
export default function ProjectsPage() {
  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 px-3">
        <SidebarTrigger aria-label="Toggle sidebar" />
        <Separator
          className="data-vertical:h-4 data-vertical:self-auto"
          orientation="vertical"
        />
        <p className="pl-2 text-sm font-medium">Projects</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ProjectsList />
      </div>
    </>
  )
}
