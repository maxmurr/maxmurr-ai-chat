"use client"

import { useState } from "react"
import {
  ChevronDownIcon,
  FileTextIcon,
  FolderIcon,
  FolderPlusIcon,
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
  SearchXIcon,
  UploadIcon,
} from "lucide-react"

import {
  filterLibraryItems,
  LIBRARY_ITEMS,
  type LibraryFilter,
  type LibraryItem,
} from "@/components/library/library-data"
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type LibraryView = "grid" | "list"

const libraryFilters = [
  { label: "All", value: "all" },
  { label: "Images", value: "images" },
  { label: "Documents", value: "documents" },
  { label: "Code", value: "code" },
] satisfies readonly { label: string; value: LibraryFilter }[]

const libraryViews = [
  { icon: LayoutGridIcon, label: "Grid view", value: "grid" },
  { icon: ListIcon, label: "List view", value: "list" },
] satisfies readonly {
  icon: typeof LayoutGridIcon
  label: string
  value: LibraryView
}[]

function LibraryGrid({ items }: { items: readonly LibraryItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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

function LibraryList({ items }: { items: readonly LibraryItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
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
                    {item.kind === "folder" ? <FolderIcon /> : <FileTextIcon />}
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="max-w-full truncate">
                      {item.name}
                    </ItemTitle>
                  </ItemContent>
                </Item>
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {item.size}
              </TableCell>
              <TableCell className="hidden tabular-nums text-muted-foreground sm:table-cell">
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

/** Renders searchable library files with grid and list views. */
export function LibraryBrowser() {
  const [filter, setFilter] = useState<LibraryFilter>("all")
  const [query, setQuery] = useState("")
  const [view, setView] = useState<LibraryView>("grid")
  const matchingItems = filterLibraryItems(LIBRARY_ITEMS, query, filter)

  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <div className="mb-6 flex items-center gap-2">
        <InputGroup className="max-w-xs pointer-coarse:h-11">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search files"
            autoComplete="off"
            name="library-search"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search files…"
            spellCheck={false}
            type="search"
            value={query}
          />
        </InputGroup>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                className="ml-auto shrink-0 pointer-coarse:h-11"
                type="button"
              />
            }
          >
            New
            <ChevronDownIcon data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuItem className="pointer-coarse:min-h-11">
                <UploadIcon />
                Upload
              </DropdownMenuItem>
              <DropdownMenuItem className="pointer-coarse:min-h-11">
                <FolderPlusIcon />
                Folder
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-4 flex min-w-0 items-center gap-2">
        <ToggleGroup
          aria-label="Filter by type"
          className="min-w-0 overflow-x-auto scrollbar-none *:shrink-0"
          onValueChange={(values) => {
            const nextFilter = values[0] as LibraryFilter | undefined
            if (nextFilter) setFilter(nextFilter)
          }}
          size="sm"
          value={[filter]}
          variant="outline"
        >
          {libraryFilters.map((item) => (
            <ToggleGroupItem
              className="pointer-coarse:h-11"
              key={item.value}
              value={item.value}
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          aria-label="View mode"
          className="ml-auto shrink-0"
          onValueChange={(values) => {
            const nextView = values[0] as LibraryView | undefined
            if (nextView) setView(nextView)
          }}
          size="sm"
          value={[view]}
          variant="outline"
        >
          {libraryViews.map((item) => (
            <ToggleGroupItem
              aria-label={item.label}
              className="pointer-coarse:h-11 pointer-coarse:min-w-11"
              key={item.value}
              value={item.value}
            >
              <item.icon />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {matchingItems.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>No matches</EmptyTitle>
            <EmptyDescription>
              {query.trim()
                ? `Nothing named “${query.trim()}” in the library.`
                : filter === "all"
                  ? "Nothing has been added here yet."
                  : "Nothing of this type here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : view === "grid" ? (
        <LibraryGrid items={matchingItems} />
      ) : (
        <LibraryList items={matchingItems} />
      )}
    </div>
  )
}
