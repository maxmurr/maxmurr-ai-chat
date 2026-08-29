import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ProjectChatsSection } from "@/features/project/components/project-chats-section";

test("Project Chat rows reveal removal action on hover and focus", () => {
  const markup = renderToStaticMarkup(
    <ProjectChatsSection
      chats={[
        {
          id: "chat-1",
          title: "Billing: build or buy",
          updatedAt: new Date("2025-08-29T00:00:00.000Z"),
        },
      ]}
    />
  );

  assert.match(markup, /lucide-message-square/);
  assert.match(markup, /pointer-fine:group-hover\/item:underline/);
  assert.match(
    markup,
    /aria-label="Remove Billing: build or buy from Project"/
  );
  assert.match(markup, /group-hover\/item:opacity-100/);
  assert.match(markup, /group-focus-within\/item:opacity-100/);
  assert.match(markup, /pointer-coarse:opacity-100/);
});
