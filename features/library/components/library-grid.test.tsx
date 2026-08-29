import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { LibraryGrid } from "@/features/library/components/library-grid";
import type { LibraryItem } from "@/features/library/components/library-data";

const items: LibraryItem[] = [
  {
    category: "images",
    href: "/api/library/files/image-1",
    id: "image-1",
    kind: "file",
    modified: "1 Jan 2026",
    name: "image.png",
    size: "1 KB",
  },
  {
    category: "documents",
    href: "/api/library/files/pdf-1",
    id: "pdf-1",
    kind: "file",
    modified: "1 Jan 2026",
    name: "file.pdf",
    size: "2 KB",
  },
];

test("Library grid previews image Files only", () => {
  const markup = renderToStaticMarkup(
    <LibraryGrid
      folders={[]}
      items={items}
      onDeleteFile={() => {}}
      onDeleteFolder={() => {}}
      onMoveFile={() => {}}
    />
  );

  assert.match(markup, /<img[^>]+src="\/api\/library\/files\/image-1"[^>]*>/);
  assert.doesNotMatch(
    markup,
    /<img[^>]+src="\/api\/library\/files\/pdf-1"[^>]*>/
  );
});
