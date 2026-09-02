import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ChatWorkspaceSwitcher } from "@/features/chat/components/chat-workspace-switcher";
import { SidebarMenu, SidebarProvider } from "@/components/ui/sidebar";

test("chat workspace switcher mounts Workspace creation integration", () => {
  const markup = renderToStaticMarkup(
    <SidebarProvider>
      <SidebarMenu>
        <ChatWorkspaceSwitcher
          activeWorkspaceId="workspace-1"
          workspaces={[{ id: "workspace-1", name: "Acme Inc." }]}
        />
      </SidebarMenu>
    </SidebarProvider>
  );

  assert.match(markup, /Acme Inc\./);
  assert.doesNotMatch(markup, />Free</);
  assert.match(markup, /rounded-md[^>]*>A<\/span>/);
  assert.doesNotMatch(markup, /lucide-briefcase-business/);
});
