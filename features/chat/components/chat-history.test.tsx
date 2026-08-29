import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ChatHistory } from "@/features/chat/components/chat-history";
import { SidebarProvider } from "@/components/ui/sidebar";

test("chat history renders collapsible sections outside active chat title provider", () => {
  const markup = renderToStaticMarkup(
    <SidebarProvider>
      <ChatHistory
        ownChats={[
          {
            id: "pinned-chat",
            pinned: true,
            projectId: "project-1",
            projectName: "Launch",
            publicToken: null,
            title: "Pinned chat",
            updatedAt: new Date(),
            visibility: "private",
          },
          {
            id: "recent-chat",
            pinned: false,
            projectId: null,
            projectName: null,
            publicToken: null,
            title: "Recent chat",
            updatedAt: new Date(),
            visibility: "private",
          },
        ]}
        projects={[{ id: "project-1", name: "Launch" }]}
        teamChats={[]}
      />
    </SidebarProvider>
  );

  assert.match(markup, />Pinned</);
  assert.match(markup, />Recents</);
  assert.match(markup, /title="Pinned chat · Launch"/);
  assert.doesNotMatch(markup, />Pinned chat · Launch</);
  assert.match(
    markup,
    /class="[^"]*motion-reduce:transition-none[^"]*lg:pointer-fine:translate-x-12[^"]*lg:pointer-fine:group-hover\/menu-item:translate-x-0[^"]*">Launch<\/span>/
  );
  assert.match(
    markup,
    /Launch<\/span><div class="[^"]*lg:pointer-fine:opacity-0[^"]*lg:pointer-fine:group-hover\/menu-item:opacity-100[^"]*"><button[^>]*aria-label="Unpin Pinned chat"/
  );
  assert.match(markup, /bg-\[var\(--conversation-actions-background\)\]/);
  assert.match(markup, />Recent chat</);
  assert.doesNotMatch(markup, /Recent chat ·/);
  assert.equal(markup.match(/aria-expanded="true"/g)?.length, 2);
  assert.match(markup, /lucide-chevron-right/);
  assert.match(
    markup,
    /aria-expanded:pointer-fine:not-hover:not-focus-visible/
  );
  assert.match(markup, /transition-\[opacity,rotate\]/);
  assert.match(markup, /group-aria-expanded\/chat-history-trigger:rotate-90/);
  assert.doesNotMatch(markup, />Today</);
  assert.doesNotMatch(markup, />Yesterday</);
});
