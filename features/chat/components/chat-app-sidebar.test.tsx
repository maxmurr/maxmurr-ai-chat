import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatAppSidebar } from "@/features/chat/components/chat-app-sidebar";

function renderChatAppSidebar(isWorkspaceAdmin: boolean) {
  return renderToStaticMarkup(
    <SidebarProvider>
      <ChatAppSidebar
        activeWorkspaceId="workspace-1"
        currentUser={{
          avatar: "",
          email: "admin@example.com",
          initials: "AD",
          name: "Admin User",
        }}
        isWorkspaceAdmin={isWorkspaceAdmin}
        ownChats={[]}
        projects={[]}
        teamChats={[]}
        workspaces={[{ id: "workspace-1", name: "Acme Inc." }]}
      />
    </SidebarProvider>
  );
}

test("workspace settings stays inside user profile menu", () => {
  const adminMarkup = renderChatAppSidebar(true);
  const footerMarkup = adminMarkup.slice(
    adminMarkup.indexOf('data-slot="sidebar-footer"'),
    adminMarkup.indexOf('data-slot="sidebar-rail"')
  );

  assert.match(footerMarkup, />Admin User</);
  assert.equal(footerMarkup.match(/data-slot="sidebar-menu-item"/g)?.length, 1);
  assert.doesNotMatch(footerMarkup, /href="\/admin"/);
});
