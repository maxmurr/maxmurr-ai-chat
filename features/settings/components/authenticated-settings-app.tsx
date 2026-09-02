import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { SettingsAppFrame } from "@/features/settings/components/settings-app-frame";
import {
  getAuthenticatedWorkspaceContext,
  getCurrentWorkspaceAdminStatus,
} from "@/features/workspace/workspace-queries";

/** Authenticates Workspace admin before rendering settings app content. */
export async function AuthenticatedSettingsApp({
  children,
}: {
  children: ReactNode;
}) {
  const workspace = await getAuthenticatedWorkspaceContext();
  const isWorkspaceAdmin = await getCurrentWorkspaceAdminStatus(
    workspace.requestHeaders,
    workspace.activeWorkspaceId
  );

  if (!isWorkspaceAdmin) {
    redirect("/chat");
  }

  return <SettingsAppFrame>{children}</SettingsAppFrame>;
}
