"use client";

import {
  ChevronDownIcon,
  FolderPlusIcon,
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
  UploadIcon,
} from "lucide-react";

import type { LibraryFilter } from "@/features/library/components/library-data";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

/** Available visual layouts for Library items. */
export type LibraryView = "grid" | "list";

const libraryFilters = [
  { label: "All", value: "all" },
  { label: "Images", value: "images" },
  { label: "Documents", value: "documents" },
  { label: "Code", value: "code" },
] satisfies readonly { label: string; value: LibraryFilter }[];

const libraryViews = [
  { icon: LayoutGridIcon, label: "Grid view", value: "grid" },
  { icon: ListIcon, label: "List view", value: "list" },
] satisfies readonly {
  icon: typeof LayoutGridIcon;
  label: string;
  value: LibraryView;
}[];

/** Renders Library search, creation, filtering, and view controls. */
export function LibraryBrowserToolbar({
  className,
  filter,
  isUploading,
  onCreateFolder,
  onFilterChange,
  onQueryChange,
  onUpload,
  onViewChange,
  query,
  view,
}: {
  className?: string;
  filter: LibraryFilter;
  isUploading: boolean;
  onCreateFolder: () => void;
  onFilterChange: (filter: LibraryFilter) => void;
  onQueryChange: (query: string) => void;
  onUpload: () => void;
  onViewChange: (view: LibraryView) => void;
  query: string;
  view: LibraryView;
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex items-center gap-2">
        <InputGroup className="max-w-xs pointer-coarse:h-11">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search Files"
            autoComplete="off"
            name="library-search"
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            placeholder="Search Files…"
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
                disabled={isUploading}
                type="button"
              />
            }
          >
            {isUploading ? (
              <>
                <Spinner data-icon="inline-start" />
                Uploading…
              </>
            ) : (
              <>
                New
                <ChevronDownIcon data-icon="inline-end" />
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="pointer-coarse:min-h-11"
                onClick={onUpload}
              >
                <UploadIcon />
                Upload Files
              </DropdownMenuItem>
              <DropdownMenuItem
                className="pointer-coarse:min-h-11"
                onClick={onCreateFolder}
              >
                <FolderPlusIcon />
                New Folder
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <ToggleGroup
          aria-label="Filter by type"
          className="min-w-0 scrollbar-none overflow-x-auto *:shrink-0"
          onValueChange={(values) => {
            const nextFilter = values[0] as LibraryFilter | undefined;
            if (nextFilter) onFilterChange(nextFilter);
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
            const nextView = values[0] as LibraryView | undefined;
            if (nextView) onViewChange(nextView);
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
    </div>
  );
}
