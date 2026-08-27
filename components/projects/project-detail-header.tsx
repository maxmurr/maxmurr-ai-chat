import type { ReactNode } from "react"
import Link from "next/link"

import { ChatPageHeader } from "@/components/chat/chat-page-header"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type ProjectDetailHeaderProps = {
  actions?: ReactNode
  className?: string
  projectName?: string
}

/** Renders project breadcrumb and optional project actions. */
export function ProjectDetailHeader({
  actions,
  className,
  projectName,
}: ProjectDetailHeaderProps) {
  return (
    <ChatPageHeader actions={actions} className={className}>
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/projects" />}>
              Projects
            </BreadcrumbLink>
          </BreadcrumbItem>
          {projectName && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">
                  {projectName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </ChatPageHeader>
  )
}
