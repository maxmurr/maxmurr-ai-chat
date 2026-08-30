import "server-only";

import { auth } from "@/di/authentication";
import { resolveActiveWorkspaceId } from "@/lib/active-workspace";
import { reportUnexpectedServerError } from "@/lib/server-error-reporting";
import type { ChatRequestContext } from "@/src/entities/models/chat-stream-request";

/** Resolves session identity and active Workspace for chat API routes. */
export async function authorizeChatRouteRequest(
  requestHeaders: Headers
): Promise<
  { context: ChatRequestContext; ok: true } | { ok: false; response: Response }
> {
  try {
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (!session) {
      return {
        ok: false,
        response: Response.json({ error: "Unauthorized." }, { status: 401 }),
      };
    }

    const organizations = await auth.api.listOrganizations({
      headers: requestHeaders,
    });
    const organizationId = resolveActiveWorkspaceId(
      organizations,
      session.session.activeOrganizationId
    );

    if (!organizationId) {
      return {
        ok: false,
        response: Response.json(
          { error: "Workspace is required." },
          { status: 403 }
        ),
      };
    }

    return {
      context: { organizationId, userId: session.user.id },
      ok: true,
    };
  } catch (error) {
    reportUnexpectedServerError(error);
    console.error(
      "Chat authorization failed.",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      ok: false,
      response: Response.json(
        { error: "Authorization is unavailable." },
        { status: 503 }
      ),
    };
  }
}
