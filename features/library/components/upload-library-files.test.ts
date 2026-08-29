import assert from "node:assert/strict";
import { test } from "node:test";

import { uploadLibraryFiles } from "@/features/library/components/upload-library-files";

const chatId = "30000000-0000-4000-8000-000000000001";

test("Chat upload sends only persisted Chat identity", async () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;

  try {
    globalThis.fetch = async (_input, init) => {
      const formData = init?.body as FormData;
      requestCount += 1;
      assert.equal(formData.get("chatId"), requestCount === 1 ? chatId : null);
      assert.equal(formData.has("folderId"), false);
      assert.equal(formData.has("projectId"), false);
      return Response.json({
        files: [
          {
            id: "20000000-0000-4000-8000-000000000001",
            mediaType: "text/plain",
            name: "notes.txt",
            size: 5,
          },
        ],
      });
    };

    const files = await uploadLibraryFiles(
      [new File(["notes"], "notes.txt", { type: "text/plain" })],
      { chatId }
    );
    assert.equal(files[0].name, "notes.txt");

    await uploadLibraryFiles([
      new File(["draft"], "draft.txt", { type: "text/plain" }),
    ]);
    assert.equal(requestCount, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
