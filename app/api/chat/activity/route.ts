import { resolveApplicationDependency } from "@/di/application-container";
import { applicationInjectionTokens } from "@/di/application-container.registry";
import { authorizeChatRouteRequest } from "@/features/chat/chat-route-auth";
import { reportUnexpectedServerError } from "@/lib/server-error-reporting";

/** Returns owner chat loading and unread states for sidebar polling. */
export async function GET(request: Request) {
  const authorization = await authorizeChatRouteRequest(request.headers);

  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const controller = resolveApplicationDependency(
      applicationInjectionTokens.chatLibraryController
    );
    const { ownChats } = await controller.listSidebarChats(
      authorization.context.organizationId,
      authorization.context.userId
    );

    return Response.json({
      chats: ownChats.map(
        ({
          activeStreamId,
          hasUnreadResponse,
          id,
          pinned,
          projectId,
          projectName,
          publicToken,
          title,
          updatedAt,
          visibility,
        }) => ({
          activeStreamId,
          hasUnreadResponse,
          id,
          pinned,
          projectId,
          projectName,
          publicToken,
          title,
          updatedAt,
          visibility,
        })
      ),
    });
  } catch (error) {
    reportUnexpectedServerError(error);
    console.error(
      "Chat activity lookup failed.",
      error instanceof Error ? error.message : "Unknown error"
    );
    return Response.json(
      { error: "Chat activity is unavailable." },
      { status: 500 }
    );
  }
}
