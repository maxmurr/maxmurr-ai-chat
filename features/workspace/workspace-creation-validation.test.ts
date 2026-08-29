import assert from "node:assert/strict";
import { test } from "node:test";

import {
  validateWorkspaceCreationMemberEmail,
  validateWorkspaceCreationMembers,
  validateWorkspaceCreationName,
} from "@/features/workspace/workspace-creation-validation";

test("Workspace creation validates nested member data", () => {
  assert.equal(validateWorkspaceCreationName(" "), "Enter a workspace name.");
  assert.equal(validateWorkspaceCreationName("Product"), undefined);
  assert.equal(
    validateWorkspaceCreationMemberEmail("not-an-email"),
    "Enter a valid email address."
  );
  assert.equal(
    validateWorkspaceCreationMembers([
      { id: "one", email: "member@example.com", role: "member" },
      { id: "two", email: "MEMBER@example.com", role: "admin" },
    ]),
    "Each member email must be unique."
  );
});
