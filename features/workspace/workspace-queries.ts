import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/di/authentication";
import { getCurrentUserSession } from "@/features/user/user-queries";
import { resolveActiveWorkspaceId } from "@/lib/active-workspace";
import { getSafeAuthenticationCallbackPath } from "@/lib/authentication-callback";

/** Resolves authenticated user and active workspace for app routes. */
async function getAuthenticatedWorkspaceContextUncached(
  onboardingCallbackValue?: unknown
) {
  const { requestHeaders, session } = await getCurrentUserSession();

  if (!session) {
    redirect("/sign-in");
  }

  const workspaces = await auth.api.listOrganizations({
    headers: requestHeaders,
  });

  if (workspaces.length === 0) {
    const callbackPath = getSafeAuthenticationCallbackPath(
      onboardingCallbackValue
    );
    redirect(
      callbackPath === "/chat"
        ? "/onboarding"
        : `/onboarding?callbackURL=${encodeURIComponent(callbackPath)}`
    );
  }

  const activeWorkspaceId = resolveActiveWorkspaceId(
    workspaces,
    session.session.activeOrganizationId
  )!;
  const name = session.user.username ?? session.user.name;

  return {
    activeWorkspaceId,
    currentUser: {
      avatar: session.user.image ?? "",
      email: session.user.email,
      initials: name.slice(0, 2).toUpperCase(),
      name,
    },
    requestHeaders,
    userId: session.user.id,
    workspaces: workspaces.map(({ id, name: workspaceName }) => ({
      id,
      name: workspaceName,
    })),
  };
}

export const getAuthenticatedWorkspaceContext = cache(
  getAuthenticatedWorkspaceContextUncached
);

/** Reports whether current user owns or administers selected workspace. */
export async function getCurrentWorkspaceAdminStatus(
  requestHeaders: Headers,
  workspaceId: string
) {
  const { role } = await auth.api.getActiveMemberRole({
    headers: requestHeaders,
    query: { organizationId: workspaceId },
  });

  return role === "owner" || role === "admin";
}

/** Resolves session, safe callback, and first-workspace onboarding state. */
export async function getWorkspaceOnboardingState(callbackValue?: unknown) {
  const callbackPath = getSafeAuthenticationCallbackPath(callbackValue);
  const { requestHeaders, session } = await getCurrentUserSession();

  if (!session) {
    redirect("/sign-in");
  }

  const workspaces = await auth.api.listOrganizations({
    headers: requestHeaders,
  });

  if (workspaces.length > 0) {
    redirect(callbackPath);
  }

  return { callbackPath };
}

/** Resolves verified user and invitation shown by invitation route. */
export async function getWorkspaceInvitationPageData(invitationId: string) {
  const { requestHeaders, session } = await getCurrentUserSession();
  const invitationPath = `/accept-invitation/${encodeURIComponent(invitationId)}`;

  if (!session?.user.emailVerified) {
    redirect(`/sign-in?callbackURL=${encodeURIComponent(invitationPath)}`);
  }

  const invitation = await auth.api
    .getInvitation({
      headers: requestHeaders,
      query: { id: invitationId },
    })
    .catch(() => null);

  return { invitation, userEmail: session.user.email };
}

/** Resolves owner and active workspace scope from supplied request headers. */
export async function getWorkspaceOwnerScope(requestHeaders: Headers) {
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    return { status: "unauthorized" as const };
  }

  const workspaces = await auth.api.listOrganizations({
    headers: requestHeaders,
  });
  const workspaceId = resolveActiveWorkspaceId(
    workspaces,
    session.session.activeOrganizationId
  );

  if (!workspaceId) {
    return { status: "workspace-required" as const };
  }

  return {
    scope: {
      organizationId: workspaceId,
      ownerId: session.user.id,
    },
    status: "authorized" as const,
  };
}
