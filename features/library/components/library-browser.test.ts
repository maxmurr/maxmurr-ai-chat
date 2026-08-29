import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createLibraryBrowserItems,
  filterLibraryItems,
  type LibraryItem,
} from "@/features/library/components/library-data";

const createdAt = new Date("2026-08-28T00:00:00.000Z");
const scope = { organizationId: "workspace-1", ownerId: "user-1" };

test("browser items map records to folders-first entries with Provenance", () => {
  const folders = [{ ...scope, createdAt, id: "folder-1", name: "Reports" }];
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
  ];

  const [folder, chatFile, deletedChatFile] = createLibraryBrowserItems(
    folders,
    files,
    true
  );

  assert.partialDeepStrictEqual(folder, {
    href: "/library/folder-1",
    kind: "folder",
    name: "Reports",
  });
  assert.partialDeepStrictEqual(chatFile, {
    category: "code",
    href: "/api/library/files/30000000-0000-4000-8000-000000000001",
    kind: "file",
    provenance: "Chat: Data cleanup",
    provenanceHref: "/chat/40000000-0000-4000-8000-000000000001",
    size: "2 KB",
  });
  assert.partialDeepStrictEqual(deletedChatFile, {
    category: "documents",
    provenance: "Deleted Chat",
  });
  assert.equal("provenanceHref" in deletedChatFile, false);
  assert.equal(
    createLibraryBrowserItems(folders, files, false).some(
      ({ kind }) => kind === "folder"
    ),
    false
  );
});

test("library filtering combines type and case-insensitive name", () => {
  const items: LibraryItem[] = [
    {
      href: "/library/folder-1",
      id: "folder-1",
      kind: "folder",
      modified: "1 Jan 2026",
      name: "Pricing revamp",
      size: "—",
    },
    {
      category: "documents",
      href: "/api/library/files/file-1",
      id: "file-1",
      kind: "file",
      modified: "1 Jan 2026",
      name: "pricing-brief.pdf",
      size: "2 MB",
    },
  ];

  assert.deepEqual(
    filterLibraryItems(items, "PRICING", "all").map(({ name }) => name),
    ["Pricing revamp", "pricing-brief.pdf"]
  );
  assert.deepEqual(
    filterLibraryItems(items, "", "documents").map(({ name }) => name),
    ["pricing-brief.pdf"]
  );
  assert.deepEqual(filterLibraryItems(items, "", "code"), []);
});
