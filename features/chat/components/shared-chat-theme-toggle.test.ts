import assert from "node:assert/strict";
import { test } from "node:test";

import { getNextSharedChatTheme } from "@/features/chat/components/shared-chat-theme-toggle";

test("shared Chat theme toggle switches resolved light and dark themes", () => {
  assert.equal(getNextSharedChatTheme("light"), "dark");
  assert.equal(getNextSharedChatTheme("dark"), "light");
  assert.equal(getNextSharedChatTheme(undefined), "dark");
});
