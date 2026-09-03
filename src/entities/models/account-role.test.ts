import assert from "node:assert/strict";
import { test } from "node:test";

import {
  accountRoleCanAccessBackoffice,
  accountRoles,
  DEFAULT_ACCOUNT_ROLE,
} from "@/src/entities/models/account-role";

test("only Super Admin Account Role grants Backoffice access", () => {
  assert.equal(DEFAULT_ACCOUNT_ROLE, accountRoles.workspace);
  assert.equal(accountRoleCanAccessBackoffice(accountRoles.superAdmin), true);
  assert.equal(accountRoleCanAccessBackoffice(accountRoles.workspace), false);
  assert.equal(accountRoleCanAccessBackoffice(undefined), false);
  assert.equal(accountRoleCanAccessBackoffice("unknown"), false);
});
