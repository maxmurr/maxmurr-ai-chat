import Link from "next/link"
import { FileTextIcon, FolderIcon } from "lucide-react"

import type {
  LibraryFolderOption,
  LibraryItem,
  LibraryItemActions,
} from "@/components/library/library-data"
import { LibraryItemMenu } from "@/components/library/library-item-menu"
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

/** Renders Library Folders and Files as metadata table. */
export function LibraryList({
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
    <div className={cn("overflow-x-auto rounded-lg border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="w-28">Size</TableHead>
            <TableHead className="hidden w-32 sm:table-cell">
              Modified
            </TableHead>
            <TableHead className="hidden w-48 lg:table-cell">
              Provenance
            </TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Item className="flex-nowrap p-0 text-left" size="sm">
                  <ItemMedia
                    className="size-8 rounded-md bg-muted"
                    variant="icon"
                  >
                    {item.kind === "folder" ? (
                      <FolderIcon />
                    ) : (
                      <FileTextIcon />
                    )}
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="max-w-full truncate">
                      {item.kind === "folder" ? (
                        <Link href={item.href}>{item.name}</Link>
                      ) : (
                        <a download href={item.href}>
                          {item.name}
                        </a>
                      )}
                    </ItemTitle>
                  </ItemContent>
                </Item>
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {item.size}
              </TableCell>
              <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                {item.modified}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {item.provenanceHref ? (
                  <Link
                    className="hover:text-foreground"
                    href={item.provenanceHref}
                  >
                    {item.provenance}
                  </Link>
                ) : (
                  item.provenance
                )}
              </TableCell>
              <TableCell>
                <LibraryItemMenu
                  folders={folders}
                  item={item}
                  onDeleteFile={onDeleteFile}
                  onDeleteFolder={onDeleteFolder}
                  onMoveFile={onMoveFile}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
