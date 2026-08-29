import Link from "next/link"
import { FileTextIcon, FolderIcon } from "lucide-react"

import type {
  LibraryFolderOption,
  LibraryItem,
  LibraryItemActions,
} from "@/features/library/components/library-data"
import { LibraryItemMenu } from "@/features/library/components/library-item-menu"
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment"
import { cn } from "@/lib/utils"

/** Renders Library Folders and Files as responsive attachment cards. */
export function LibraryGrid({
  className,
  folders,
  items,
  onDeleteFile,
  onDeleteFolder,
  onMoveFile,
}: {
  className?: string
  folders: readonly LibraryFolderOption[]
  items: readonly LibraryItem[]
} & LibraryItemActions) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 @lg:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-5 @6xl:grid-cols-6",
        className
      )}
    >
      {items.map((item) => (
        <Attachment className="w-full!" key={item.id} orientation="vertical">
          <AttachmentTrigger
            aria-label={
              item.kind === "folder"
                ? `Open ${item.name}`
                : `Download ${item.name}`
            }
            render={
              item.kind === "folder" ? (
                <Link href={item.href} />
              ) : (
                <a download href={item.href} />
              )
            }
          />
          <AttachmentMedia>
            {item.kind === "folder" ? <FolderIcon /> : <FileTextIcon />}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{item.name}</AttachmentTitle>
            <AttachmentDescription>
              {item.kind === "folder" ? "Folder" : item.size}
            </AttachmentDescription>
            {item.provenance && (
              <AttachmentDescription>
                {item.provenanceHref ? (
                  <Link
                    className="relative z-20 hover:text-foreground"
                    href={item.provenanceHref}
                  >
                    {item.provenance}
                  </Link>
                ) : (
                  item.provenance
                )}
              </AttachmentDescription>
            )}
          </AttachmentContent>
          <AttachmentActions>
            <LibraryItemMenu
              folders={folders}
              item={item}
              onDeleteFile={onDeleteFile}
              onDeleteFolder={onDeleteFolder}
              onMoveFile={onMoveFile}
            />
          </AttachmentActions>
        </Attachment>
      ))}
    </div>
  )
}
