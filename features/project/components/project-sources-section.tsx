"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileTextIcon,
  LibraryBigIcon,
  PlusIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { TouchTarget } from "@/components/ui/touch-target";
import { formatLibraryFileSize } from "@/features/library/components/library-data";
import { uploadLibraryFiles } from "@/features/library/components/upload-library-files";
import { ProjectSection } from "@/features/project/components/project-section";
import {
  addProjectSourceAction,
  removeProjectSourceAction,
} from "@/features/project/project-actions";
import {
  createLibraryFileDownloadUrl,
  LIBRARY_FILE_ACCEPT,
} from "@/src/entities/models/library";

type ProjectSourceItem = {
  id: string;
  mediaType: string;
  name: string;
  size: number;
};

function formatProjectSourceType(mediaType: string) {
  const subtype = mediaType.split("/").at(-1) ?? mediaType;
  const normalizedSubtype =
    subtype.split("+")[0].split(".").at(-1)?.replace(/^x-/, "") ?? subtype;

  return normalizedSubtype.length <= 4
    ? normalizedSubtype.toUpperCase()
    : normalizedSubtype.charAt(0).toUpperCase() + normalizedSubtype.slice(1);
}

function showProjectSourceError(description: string) {
  toast.add({ description, title: "Source update failed", type: "error" });
}

function ProjectLibrarySourceDialog({
  availableFiles,
  onOpenChange,
  open,
  projectId,
}: {
  availableFiles: readonly ProjectSourceItem[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectId: string;
}) {
  const [pendingFileId, setPendingFileId] = useState<string | null>(null);

  async function addSource(fileId: string) {
    setPendingFileId(fileId);
    const result = await addProjectSourceAction(projectId, fileId);
    setPendingFileId(null);

    if (!result.ok) {
      showProjectSourceError(result.error);
      return;
    }

    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <CommandDialog
      description="Move a File the Library already holds into this Project."
      onOpenChange={onOpenChange}
      open={open}
      title="Add from Library"
    >
      <Command>
        <CommandInput
          aria-label="Search Library Files"
          name="project-library-search"
          placeholder="Search Library…"
        />
        <CommandList>
          <CommandEmpty>No Files available.</CommandEmpty>
          {availableFiles.length > 0 && (
            <CommandGroup heading="Library">
              {availableFiles.map((file) => (
                <CommandItem
                  disabled={pendingFileId !== null}
                  key={file.id}
                  onSelect={() => void addSource(file.id)}
                  value={`${file.name} ${file.id}`}
                >
                  {pendingFileId === file.id ? <Spinner /> : <FileTextIcon />}
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <CommandShortcut className="tracking-normal">
                    {formatLibraryFileSize(file.size)}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

/** Renders real Project Sources with upload, Library move, and removal actions. */
export function ProjectSourcesSection({
  availableFiles,
  className,
  projectId,
  sources,
}: {
  availableFiles: readonly ProjectSourceItem[];
  className?: string;
  projectId: string;
  sources: readonly ProjectSourceItem[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [removingFileId, setRemovingFileId] = useState<string | null>(null);

  async function uploadSources(files: File[]) {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      await uploadLibraryFiles(files, null, projectId);
      router.refresh();
    } catch (error) {
      showProjectSourceError(
        error instanceof Error ? error.message : "Could not upload Sources."
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function removeSource(fileId: string) {
    setRemovingFileId(fileId);
    const result = await removeProjectSourceAction(projectId, fileId);
    setRemovingFileId(null);
    if (!result.ok) showProjectSourceError(result.error);
  }

  return (
    <ProjectSection
      action={
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                className="h-11 sm:h-7"
                disabled={isUploading}
                size="sm"
                type="button"
                variant="outline"
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
                <PlusIcon data-icon="inline-start" />
                Add Source
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <UploadIcon />
                Upload
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsLibraryOpen(true)}>
                <LibraryBigIcon />
                Add from Library
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      }
      className={className}
      id="project-sources"
      title="Sources"
    >
      {sources.length > 0 ? (
        <div className="@container">
          <div className="grid gap-2 @sm:grid-cols-2">
            {sources.map((source) => (
              <Attachment className="w-full" key={source.id}>
                <AttachmentTrigger
                  aria-label={`Download ${source.name}`}
                  render={
                    <a
                      download
                      href={createLibraryFileDownloadUrl(source.id)}
                    />
                  }
                />
                <AttachmentMedia>
                  <FileTextIcon />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{source.name}</AttachmentTitle>
                  <AttachmentDescription>
                    {formatProjectSourceType(source.mediaType)} ·{" "}
                    {formatLibraryFileSize(source.size)}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction
                    aria-label={`Remove ${source.name} from Project`}
                    className="relative opacity-0 group-focus-within/attachment:opacity-100 group-hover/attachment:opacity-100 pointer-coarse:opacity-100"
                    disabled={removingFileId !== null}
                    onClick={() => void removeSource(source.id)}
                    type="button"
                  >
                    {removingFileId === source.id ? <Spinner /> : <XIcon />}
                    <TouchTarget />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-base text-pretty text-muted-foreground sm:text-sm">
          No Sources yet. Upload Files or move them here from your Library.
        </p>
      )}

      <Input
        ref={fileInputRef}
        accept={LIBRARY_FILE_ACCEPT}
        aria-label="Choose Project Source Files"
        className="hidden"
        multiple
        name="project-sources"
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = "";
          void uploadSources(files);
        }}
        type="file"
      />
      <ProjectLibrarySourceDialog
        availableFiles={availableFiles}
        onOpenChange={setIsLibraryOpen}
        open={isLibraryOpen}
        projectId={projectId}
      />
    </ProjectSection>
  );
}
