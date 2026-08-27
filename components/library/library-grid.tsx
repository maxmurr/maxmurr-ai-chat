import { FileTextIcon, FolderIcon } from "lucide-react"

import type { LibraryItem } from "@/components/library/library-data"
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { cn } from "@/lib/utils"

/** Renders library folders and files as responsive attachment cards. */
export function LibraryGrid({
  className,
  items,
}: {
  className?: string
  items: readonly LibraryItem[]
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <Attachment className="w-full!" key={item.name} orientation="vertical">
          <AttachmentMedia>
            {item.kind === "folder" ? <FolderIcon /> : <FileTextIcon />}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{item.name}</AttachmentTitle>
            <AttachmentDescription>
              {item.kind === "folder" ? "Folder" : item.size}
            </AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      ))}
    </div>
  )
}
