import { resolveApplicationDependency } from "@/di/application-container";
import { applicationInjectionTokens } from "@/di/application-container.registry";
import { authorizeChatRouteRequest } from "@/features/chat/chat-route-auth";
import { reportUnexpectedServerError } from "@/lib/server-error-reporting";
import {
  ChatAccessDeniedError,
  ChatUnavailableError,
  InvalidChatRequestError,
} from "@/src/entities/errors/chat-errors";

/** Cancels one active owner chat response without treating navigation as stop. */
export async function POST(
  request: Request,
  routeContext: RouteContext<"/api/chat/[chatId]/stop">
) {
  const authorization = await authorizeChatRouteRequest(request.headers);

  if (!authorization.ok) {
    return authorization.response;
  }

  const { chatId } = await routeContext.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid chat stop request." },
      { status: 400 }
    );
  }

  try {
    const controller = resolveApplicationDependency(
      applicationInjectionTokens.chatStreamLifecycleController
    );
    await controller.stopChatStream(chatId, body, authorization.context);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof ChatAccessDeniedError) {
      return Response.json({ error: "Chat not found." }, { status: 404 });
    }

    if (error instanceof InvalidChatRequestError) {
      return Response.json(
        { error: "Invalid chat stop request." },
        { status: 400 }
      );
    }

    const cause = error instanceof ChatUnavailableError ? error.cause : error;
    reportUnexpectedServerError(cause);
    console.error(
      "Chat stream stop failed.",
      cause instanceof Error ? cause.message : "Unknown error"
    );
    return Response.json({ error: "Chat is unavailable." }, { status: 500 });
  }
}
