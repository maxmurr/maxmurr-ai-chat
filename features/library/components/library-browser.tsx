"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchXIcon } from "lucide-react";

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
import {
  LibraryBrowserToolbar,
  type LibraryView,
} from "@/features/library/components/library-browser-toolbar";
import { LibraryGrid } from "@/features/library/components/library-grid";
import { LibraryList } from "@/features/library/components/library-list";
import { uploadLibraryFiles } from "@/features/library/components/upload-library-files";
import { AppPageContainer } from "@/components/app-page-container";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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
      await uploadLibraryFiles(
        files,
        activeFolderId ? { folderId: activeFolderId } : undefined
      );
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
        <LibraryBrowserToolbar
          className="mb-4"
          filter={filter}
          isUploading={isUploading}
          onCreateFolder={() => setCreateFolderOpen(true)}
          onFiles={(files) => void uploadFiles(files)}
          onFilterChange={setFilter}
          onQueryChange={setQuery}
          onViewChange={setView}
          query={query}
          view={view}
        />

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
