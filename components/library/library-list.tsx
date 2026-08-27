import { FileTextIcon, FolderIcon } from "lucide-react"

import type { LibraryItem } from "@/components/library/library-data"
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

/** Renders library folders and files as a metadata table. */
export function LibraryList({
  className,
  items,
}: {
  className?: string
  items: readonly LibraryItem[]
}) {
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
            <TableHead className="hidden w-48 lg:table-cell">Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.name}>
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
                      {item.name}
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
                {item.source}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
