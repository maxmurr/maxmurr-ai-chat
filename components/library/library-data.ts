export type LibraryFilter = "all" | "images" | "documents" | "code"

export type LibraryItem = {
  category?: Exclude<LibraryFilter, "all">
  kind: "file" | "folder"
  modified: string
  name: string
  size: string
  source?: string
}

/** Seeded workspace library represented by reference page. */
export const LIBRARY_ITEMS: readonly LibraryItem[] = [
  {
    kind: "folder",
    modified: "Jan 1, 2026",
    name: "Pricing revamp",
    size: "—",
  },
  {
    kind: "folder",
    modified: "Dec 31, 2025",
    name: "Incidents",
    size: "—",
  },
  {
    category: "documents",
    kind: "file",
    modified: "Dec 28, 2025",
    name: "pricing-brief.pdf",
    size: "2.3 MB",
  },
  {
    category: "documents",
    kind: "file",
    modified: "Jan 1, 2026",
    name: "q3-cohorts.csv",
    size: "94 KB",
  },
]

/** Filters library items by type and case-insensitive filename query. */
export function filterLibraryItems(
  items: readonly LibraryItem[],
  query: string,
  filter: LibraryFilter,
) {
  const normalizedQuery = query.trim().toLowerCase()

  return items.filter(
    (item) =>
      (filter === "all" || item.category === filter) &&
      item.name.toLowerCase().includes(normalizedQuery),
  )
}
