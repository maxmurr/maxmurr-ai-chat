import assert from "node:assert/strict";
import { test } from "node:test";

import { PROJECT_DELETE_CONSEQUENCES } from "@/features/project/components/project-actions";

test("Project delete confirmation warns that Chats are deleted", () => {
  assert.equal(
    PROJECT_DELETE_CONSEQUENCES,
    "Chats are deleted; Library Files remain available."
  );
});
