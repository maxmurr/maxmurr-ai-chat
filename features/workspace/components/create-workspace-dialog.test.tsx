import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { CreateWorkspaceDialog } from "@/features/workspace/components/create-workspace-dialog";

test("Workspace creation dialog server-renders without browser globals", () => {
  assert.doesNotThrow(() =>
    renderToStaticMarkup(<CreateWorkspaceDialog onOpenChange={() => {}} open />)
  );
});
