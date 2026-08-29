import assert from "node:assert/strict";
import { test } from "node:test";

import { inviteWorkspaceMembers } from "@/features/workspace/workspace-invitations";

test("Workspace invitations preserve roles and report each failure", async () => {
  const sentInvitations: Array<{
    email: string;
    organizationId: string;
    role: "admin" | "member";
  }> = [];
  const reportedErrors: unknown[] = [];
  const failedEmails = await inviteWorkspaceMembers(
    "workspace-1",
    [
      { email: " Admin@Example.com ", role: "admin" },
      { email: "api-error@example.com", role: "member" },
      { email: "network-error@example.com", role: "member" },
    ],
    async (invitation) => {
      sentInvitations.push(invitation);

      if (invitation.email === "api-error@example.com") {
        throw new Error("Invitation rejected");
      }

      if (invitation.email === "network-error@example.com") {
        throw new Error("Network unavailable");
      }

      return undefined;
    },
    (error) => reportedErrors.push(error)
  );

  assert.deepEqual(reportedErrors, [
    new Error("Invitation rejected"),
    new Error("Network unavailable"),
  ]);
  assert.deepEqual(sentInvitations, [
    {
      email: "admin@example.com",
      organizationId: "workspace-1",
      role: "admin",
    },
    {
      email: "api-error@example.com",
      organizationId: "workspace-1",
      role: "member",
    },
    {
      email: "network-error@example.com",
      organizationId: "workspace-1",
      role: "member",
    },
  ]);
  assert.deepEqual(failedEmails, [
    "api-error@example.com",
    "network-error@example.com",
  ]);
});
