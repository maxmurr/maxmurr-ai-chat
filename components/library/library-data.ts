import type {
  LibraryFileSummary,
  LibraryFolder,
} from "@/src/entities/models/library"
import {
  createLibraryFileDownloadUrl,
  getLibraryFileCategory,
} from "@/src/entities/models/library"

export type LibraryFilter = "all" | "images" | "documents" | "code"

export type LibraryFolderOption = {
  id: string
  name: string
}

export type LibraryItem = {
  category?: Exclude<LibraryFilter, "all">
  folderId?: string | null
  href: string
  id: string
  kind: "file" | "folder"
  modified: string
  name: string
  provenance?: string
  provenanceHref?: string
  size: string
}

/** Mutation callbacks shared by the Library grid and list views. */
export type LibraryItemActions = {
  onDeleteFile: (fileId: string) => void
  onDeleteFolder: (folder: LibraryItem) => void
  onMoveFile: (fileId: string, folderId: string | null) => void
}

/** Seeded mock retained only for Projects page until its follow-up. */
export const LIBRARY_ITEMS: readonly LibraryItem[] = [
  {
    href: "/library/mock-pricing-revamp",
    id: "mock-pricing-revamp",
    kind: "folder",
    modified: "Jan 1, 2026",
    name: "Pricing revamp",
    size: "—",
  },
  {
    href: "/library/mock-incidents",
    id: "mock-incidents",
    kind: "folder",
    modified: "Dec 31, 2025",
    name: "Incidents",
    size: "—",
  },
  {
    category: "documents",
    href: "#",
    id: "mock-pricing-brief",
    kind: "file",
    modified: "Dec 28, 2025",
    name: "pricing-brief.pdf",
    size: "2.3 MB",
  },
  {
    category: "documents",
    href: "#",
    id: "mock-q3-cohorts",
    kind: "file",
    modified: "Jan 1, 2026",
    name: "q3-cohorts.csv",
    size: "94 KB",
  },
]

const libraryDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
})
const librarySizeFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
})

function formatLibraryFileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 ** 2) {
    return `${librarySizeFormatter.format(size / 1024)} KB`
  }
  return `${librarySizeFormatter.format(size / 1024 ** 2)} MB`
}

/** Converts owner-scoped records to serializable Library browser items. */
export function createLibraryBrowserItems(
  folders: readonly LibraryFolder[],
  files: readonly LibraryFileSummary[],
  showFolders: boolean
): LibraryItem[] {
  return [
    ...(showFolders
      ? folders.map(
          (folder): LibraryItem => ({
            href: `/library/${folder.id}`,
            id: folder.id,
            kind: "folder",
            modified: libraryDateFormatter.format(folder.createdAt),
            name: folder.name,
            size: "—",
          })
        )
      : []),
    ...files.map(
      (file): LibraryItem => ({
        category: getLibraryFileCategory(file.mediaType),
        folderId: file.folderId,
        href: createLibraryFileDownloadUrl(file.id),
        id: file.id,
        kind: "file",
        modified: libraryDateFormatter.format(file.createdAt),
        name: file.name,
        size: formatLibraryFileSize(file.size),
        ...(file.provenanceChatId
          ? {
              provenance: file.provenanceChatTitle
                ? `Chat: ${file.provenanceChatTitle}`
                : "Deleted Chat",
              ...(file.provenanceChatTitle
                ? { provenanceHref: `/chat/${file.provenanceChatId}` }
                : {}),
            }
          : {}),
      })
    ),
  ]
}

/** Filters Library items by type and case-insensitive name. */
export function filterLibraryItems(
  items: readonly LibraryItem[],
  query: string,
  filter: LibraryFilter
) {
  const normalizedQuery = query.trim().toLowerCase()

  return items.filter(
    (item) =>
      (filter === "all" || item.category === filter) &&
      item.name.toLowerCase().includes(normalizedQuery)
  )
}
