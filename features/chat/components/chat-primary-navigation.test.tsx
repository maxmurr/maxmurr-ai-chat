import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatPrimaryNavigation } from "@/features/chat/components/chat-primary-navigation";

test("Projects navigation keeps row hover while quick create changes icon color", () => {
  const markup = renderToStaticMarkup(
    <SidebarProvider>
      <ChatPrimaryNavigation ownChats={[]} teamChats={[]} />
    </SidebarProvider>
  );
  const projectsLink = markup.match(/<a[^>]*href="\/projects"[^>]*>/)?.[0];
  const newProjectAction = markup.match(
    /<button[^>]*aria-label="New project"[^>]*>/
  )?.[0];

  assert.ok(projectsLink);
  assert.match(
    projectsLink,
    /pointer-fine:group-hover\/menu-item:bg-sidebar-accent/
  );
  assert.match(
    projectsLink,
    /pointer-fine:group-hover\/menu-item:text-sidebar-accent-foreground/
  );
  assert.ok(newProjectAction);
  assert.match(newProjectAction, /text-muted-foreground!/);
  assert.match(newProjectAction, /hover:bg-transparent!/);
  assert.match(newProjectAction, /hover:text-sidebar-accent-foreground!/);
  assert.match(newProjectAction, /group-hover\/menu-item:opacity-100/);
  assert.match(
    newProjectAction,
    /group-has-focus-visible\/menu-item:opacity-100/
  );
  assert.doesNotMatch(newProjectAction, /group-focus-within\/menu-item/);
  assert.match(newProjectAction, /md:opacity-0/);
});
