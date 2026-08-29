"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  FolderPlusIcon,
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
  SearchXIcon,
  UploadIcon,
} from "lucide-react";

import {
  createLibraryFolderAction,
  deleteLibraryFileAction,
  deleteLibraryFolderAction,
  moveLibraryFileAction,
} from "@/features/library/library-actions";
import {
  filterLibraryItems,
  type LibraryFilter,
  type LibraryFolderOption,
  type LibraryItem,
} from "@/features/library/components/library-data";
import {
  LibraryCreateFolderDialog,
  LibraryDeleteFolderDialog,
} from "@/features/library/components/library-folder-dialogs";
import { LibraryGrid } from "@/features/library/components/library-grid";
import { LibraryList } from "@/features/library/components/library-list";
import { uploadLibraryFiles } from "@/features/library/components/upload-library-files";
import { AppPageContainer } from "@/components/app-page-container";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { LIBRARY_FILE_ACCEPT } from "@/src/entities/models/library";

type LibraryView = "grid" | "list";

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

/** Renders searchable, mutable owner Library in grid and list views. */
export function LibraryBrowser({
  activeFolderId = null,
  className,
  currentFolderName,
  folders,
  items,
}: {
  activeFolderId?: string | null;
  className?: string;
  currentFolderName?: string;
  folders: readonly LibraryFolderOption[];
  items: readonly LibraryItem[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [deleteFolder, setDeleteFolder] = useState<LibraryItem | null>(null);
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [folderName, setFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<LibraryView>("grid");
  const matchingItems = filterLibraryItems(items, query, filter);

  function showLibraryError(title: string, description: string) {
    toast.add({ description, title, type: "error" });
  }

  async function createFolder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreatingFolder(true);
    const result = await createLibraryFolderAction(folderName);
    setIsCreatingFolder(false);

    if (!result.ok) {
      showLibraryError("Folder creation failed", result.error);
      return;
    }

    setFolderName("");
    setCreateFolderOpen(false);
  }

  async function deleteFile(fileId: string) {
    const result = await deleteLibraryFileAction(fileId);
    if (!result.ok) showLibraryError("File deletion failed", result.error);
  }

  async function confirmFolderDeletion() {
    if (!deleteFolder) return;

    setIsDeletingFolder(true);
    const result = await deleteLibraryFolderAction(deleteFolder.id);
    setIsDeletingFolder(false);
    setDeleteFolder(null);

    if (!result.ok) showLibraryError("Folder deletion failed", result.error);
  }

  async function moveFile(fileId: string, folderId: string | null) {
    const result = await moveLibraryFileAction(fileId, folderId);
    if (!result.ok) showLibraryError("File move failed", result.error);
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      await uploadLibraryFiles(files, activeFolderId);
      router.refresh();
    } catch (error) {
      showLibraryError(
        "File upload failed",
        error instanceof Error ? error.message : "Could not upload Files."
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <AppPageContainer className={cn("mx-auto", className)}>
        <Input
          ref={fileInputRef}
          accept={LIBRARY_FILE_ACCEPT}
          aria-label="Choose Files to upload"
          className="hidden"
          multiple
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = "";
            void uploadFiles(files);
          }}
          type="file"
        />

        <div className="mb-6 flex items-center gap-2">
          <InputGroup className="max-w-xs pointer-coarse:h-11">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Search Files"
              autoComplete="off"
              name="library-search"
              onChange={(event) => setQuery(event.currentTarget.value)}
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
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon />
                  Upload Files
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="pointer-coarse:min-h-11"
                  onClick={() => setCreateFolderOpen(true)}
                >
                  <FolderPlusIcon />
                  New Folder
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-4 flex min-w-0 items-center gap-2">
          <ToggleGroup
            aria-label="Filter by type"
            className="min-w-0 scrollbar-none overflow-x-auto *:shrink-0"
            onValueChange={(values) => {
              const nextFilter = values[0] as LibraryFilter | undefined;
              if (nextFilter) setFilter(nextFilter);
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
              if (nextView) setView(nextView);
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
                  ? `Nothing named “${query.trim()}” here.`
                  : filter === "all"
                    ? currentFolderName
                      ? "This Folder is empty."
                      : "Library is empty."
                    : "Nothing of this type here."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : view === "grid" ? (
          <LibraryGrid
            folders={folders}
            items={matchingItems}
            onDeleteFile={(fileId) => void deleteFile(fileId)}
            onDeleteFolder={setDeleteFolder}
            onMoveFile={(fileId, folderId) => void moveFile(fileId, folderId)}
          />
        ) : (
          <LibraryList
            folders={folders}
            items={matchingItems}
            onDeleteFile={(fileId) => void deleteFile(fileId)}
            onDeleteFolder={setDeleteFolder}
            onMoveFile={(fileId, folderId) => void moveFile(fileId, folderId)}
          />
        )}
      </AppPageContainer>

      <LibraryCreateFolderDialog
        folderName={folderName}
        isPending={isCreatingFolder}
        onFolderNameChange={setFolderName}
        onOpenChange={setCreateFolderOpen}
        onSubmit={createFolder}
        open={createFolderOpen}
      />

      <LibraryDeleteFolderDialog
        folderName={deleteFolder?.name}
        isPending={isDeletingFolder}
        onConfirm={() => void confirmFolderDeletion()}
        onOpenChange={(open) => {
          if (!open && !isDeletingFolder) setDeleteFolder(null);
        }}
        open={deleteFolder !== null}
      />
    </>
  );
}
