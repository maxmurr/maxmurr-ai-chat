import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SidebarProvider } from "@/components/ui/sidebar";
import { ProjectDetailSkeleton } from "@/features/project/components/project-detail";

test("Project detail loading breadcrumb matches Library skeleton", () => {
  const markup = renderToStaticMarkup(
    <SidebarProvider>
      <ProjectDetailSkeleton />
    </SidebarProvider>
  );

  assert.match(markup, /<header[^>]*>.*data-slot="skeleton"/);
  assert.doesNotMatch(markup, /Loading…/);
});
