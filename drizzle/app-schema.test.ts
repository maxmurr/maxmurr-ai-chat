import assert from "node:assert/strict";
import { test } from "node:test";

import { getTableConfig } from "drizzle-orm/pg-core";

import {
  chat,
  libraryFile,
  project,
  projectSource,
} from "@/drizzle/app-schema";

test("Project deletion cascades to Chats at database boundary", () => {
  const projectForeignKey = getTableConfig(chat).foreignKeys.find(
    (foreignKey) => foreignKey.reference().foreignTable === project
  );

  assert.equal(projectForeignKey?.onDelete, "cascade");
});

test("deleting Project or File removes Source link only", () => {
  const sourceForeignKeys = getTableConfig(projectSource).foreignKeys;
  const projectForeignKey = sourceForeignKeys.find(
    (foreignKey) => foreignKey.reference().foreignTable === project
  );
  const fileForeignKey = sourceForeignKeys.find(
    (foreignKey) => foreignKey.reference().foreignTable === libraryFile
  );

  assert.equal(projectForeignKey?.onDelete, "cascade");
  assert.equal(fileForeignKey?.onDelete, "cascade");
});
