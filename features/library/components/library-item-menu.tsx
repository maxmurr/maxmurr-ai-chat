import {
  CheckIcon,
  DownloadIcon,
  FolderInputIcon,
  HouseIcon,
  MoreHorizontalIcon,
  Trash2Icon,
} from "lucide-react"

import type {
  LibraryFolderOption,
  LibraryItem,
} from "@/features/library/components/library-data"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TouchTarget } from "@/components/ui/touch-target"

/** Renders download, move, and delete menu for one Folder or File. */
export function LibraryItemMenu({
  folders,
  item,
  onDeleteFile,
  onDeleteFolder,
  onMoveFile,
}: {
  folders: readonly LibraryFolderOption[]
  item: LibraryItem
  onDeleteFile: (fileId: string) => void
  onDeleteFolder: (folder: LibraryItem) => void
  onMoveFile: (fileId: string, folderId: string | null) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={`Actions for ${item.name}`}
            className="relative"
            size="icon-sm"
            type="button"
            variant="ghost"
          />
        }
      >
        <MoreHorizontalIcon />
        <TouchTarget />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {item.kind === "folder" ? (
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => onDeleteFolder(item)}
              variant="destructive"
            >
              <Trash2Icon />
              Delete Folder
            </DropdownMenuItem>
          </DropdownMenuGroup>
        ) : (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={<a download href={item.href} />}
              >
                <DownloadIcon />
                Download
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderInputIcon />
                  Move to
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => onMoveFile(item.id, null)}
                    >
                      <HouseIcon />
                      Library root
                      {item.folderId === null && <CheckIcon className="ml-auto" />}
                    </DropdownMenuItem>
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onClick={() => onMoveFile(item.id, folder.id)}
                      >
                        {folder.name}
                        {item.folderId === folder.id && (
                          <CheckIcon className="ml-auto" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => onDeleteFile(item.id)}
                variant="destructive"
              >
                <Trash2Icon />
                Delete File
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
