import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatPrimaryNavigation } from "@/features/chat/components/chat-primary-navigation";

test("Projects navigation exposes quick create on hover and focus", () => {
  const markup = renderToStaticMarkup(
    <SidebarProvider>
      <ChatPrimaryNavigation ownChats={[]} teamChats={[]} />
    </SidebarProvider>
  );
  const newProjectAction = markup.match(
    /<button[^>]*aria-label="New project"[^>]*>/
  )?.[0];

  assert.ok(newProjectAction);
  assert.match(newProjectAction, /group-hover\/menu-item:opacity-100/);
  assert.match(
    newProjectAction,
    /group-has-focus-visible\/menu-item:opacity-100/
  );
  assert.doesNotMatch(newProjectAction, /group-focus-within\/menu-item/);
  assert.match(newProjectAction, /md:opacity-0/);
});
