import { UI_MESSAGE_STREAM_HEADERS } from "ai";

import { resolveApplicationDependency } from "@/di/application-container";
import { applicationInjectionTokens } from "@/di/application-container.registry";
import { authorizeChatRouteRequest } from "@/features/chat/chat-route-auth";
import { reportUnexpectedServerError } from "@/lib/server-error-reporting";
import {
  ChatAccessDeniedError,
  ChatUnavailableError,
  InvalidChatRequestError,
} from "@/src/entities/errors/chat-errors";

export const maxDuration = 60;

/** Resumes one owner chat response stream from Redis replay state. */
export async function GET(
  request: Request,
  routeContext: RouteContext<"/api/chat/[chatId]/stream">
) {
  const authorization = await authorizeChatRouteRequest(request.headers);

  if (!authorization.ok) {
    return authorization.response;
  }

  const { chatId } = await routeContext.params;

  try {
    const controller = resolveApplicationDependency(
      applicationInjectionTokens.chatStreamLifecycleController
    );
    const stream = await controller.resumeChatStream(
      chatId,
      authorization.context
    );

    if (!stream) {
      return new Response(null, { status: 204 });
    }

    return new Response(stream.pipeThrough(new TextEncoderStream()), {
      headers: UI_MESSAGE_STREAM_HEADERS,
    });
  } catch (error) {
    if (
      error instanceof ChatAccessDeniedError ||
      error instanceof InvalidChatRequestError
    ) {
      return Response.json({ error: "Chat not found." }, { status: 404 });
    }

    const cause = error instanceof ChatUnavailableError ? error.cause : error;
    reportUnexpectedServerError(cause);
    console.error(
      "Chat stream resume failed.",
      cause instanceof Error ? cause.message : "Unknown error"
    );
    return Response.json({ error: "Chat is unavailable." }, { status: 500 });
  }
}
