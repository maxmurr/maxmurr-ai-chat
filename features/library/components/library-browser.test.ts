import assert from "node:assert/strict"
import { test } from "node:test"

import {
  createLibraryBrowserItems,
  filterLibraryItems,
  LIBRARY_ITEMS,
} from "@/features/library/components/library-data"

const createdAt = new Date("2026-08-28T00:00:00.000Z")
const scope = { organizationId: "workspace-1", ownerId: "user-1" }

test("browser items map records to folders-first entries with Provenance", () => {
  const folders = [
    { ...scope, createdAt, id: "folder-1", name: "Reports" },
  ]
  const files = [
    {
      ...scope,
      createdAt,
      folderId: null,
      id: "30000000-0000-4000-8000-000000000001",
      mediaType: "text/x-python",
      name: "script.py",
      provenanceChatId: "40000000-0000-4000-8000-000000000001",
      provenanceChatTitle: "Data cleanup",
      provenanceMessageId: "message-1",
      size: 2048,
    },
    {
      ...scope,
      createdAt,
      folderId: null,
      id: "30000000-0000-4000-8000-000000000002",
      mediaType: "application/pdf",
      name: "brief.pdf",
      provenanceChatId: "40000000-0000-4000-8000-000000000002",
      provenanceChatTitle: null,
      provenanceMessageId: "message-2",
      size: 1024,
    },
  ]

  const [folder, chatFile, deletedChatFile] = createLibraryBrowserItems(
    folders,
    files,
    true
  )

  assert.partialDeepStrictEqual(folder, {
    href: "/library/folder-1",
    kind: "folder",
    name: "Reports",
  })
  assert.partialDeepStrictEqual(chatFile, {
    category: "code",
    href: "/api/library/files/30000000-0000-4000-8000-000000000001",
    kind: "file",
    provenance: "Chat: Data cleanup",
    provenanceHref: "/chat/40000000-0000-4000-8000-000000000001",
    size: "2 KB",
  })
  assert.partialDeepStrictEqual(deletedChatFile, {
    category: "documents",
    provenance: "Deleted Chat",
  })
  assert.equal("provenanceHref" in deletedChatFile, false)
  assert.equal(
    createLibraryBrowserItems(folders, files, false).some(
      ({ kind }) => kind === "folder"
    ),
    false
  )
})

test("library filtering combines type and case-insensitive name", () => {
  assert.deepEqual(
    filterLibraryItems(LIBRARY_ITEMS, "PRICING", "all").map(({ name }) => name),
    ["Pricing revamp", "pricing-brief.pdf"],
  )
  assert.deepEqual(
    filterLibraryItems(LIBRARY_ITEMS, "", "documents").map(({ name }) => name),
    ["pricing-brief.pdf", "q3-cohorts.csv"],
  )
  assert.deepEqual(filterLibraryItems(LIBRARY_ITEMS, "", "code"), [])
})
