import assert from "node:assert/strict";
import { test } from "node:test";

import { getTableConfig } from "drizzle-orm/pg-core";

import { chat, project } from "@/drizzle/app-schema";

test("Project deletion cascades to Chats at database boundary", () => {
  const projectForeignKey = getTableConfig(chat).foreignKeys.find(
    (foreignKey) => foreignKey.reference().foreignTable === project
  );

  assert.equal(projectForeignKey?.onDelete, "cascade");
});
