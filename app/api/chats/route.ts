import { resolveApplicationDependency } from "@/di/application-container";
import { applicationInjectionTokens } from "@/di/application-container.registry";
import { authorizeChatRouteRequest } from "@/features/chat/chat-route-auth";
import { serializeChatListPage } from "@/features/chat/chat-list-contract";
import { reportUnexpectedServerError } from "@/lib/server-error-reporting";
import { InvalidChatRequestError } from "@/src/entities/errors/chat-errors";

/** Returns one cursor page of searchable owner Chats. */
export async function GET(request: Request) {
  const authorization = await authorizeChatRouteRequest(request.headers);

  if (!authorization.ok) {
    return authorization.response;
  }

  const searchParams = new URL(request.url).searchParams;
  const cursorId = searchParams.get("cursorId");
  const cursorUpdatedAt = searchParams.get("cursorUpdatedAt");
  const cursor =
    cursorId || cursorUpdatedAt
      ? {
          id: cursorId,
          updatedAt: cursorUpdatedAt ? new Date(cursorUpdatedAt) : null,
        }
      : null;

  try {
    const controller = resolveApplicationDependency(
      applicationInjectionTokens.chatLibraryController
    );
    const page = await controller.listOwnChatsPage(
      {
        cursor,
        filter: searchParams.get("filter") ?? "all",
        limit: 30,
        query: searchParams.get("query") ?? "",
      },
      {
        organizationId: authorization.context.organizationId,
        ownerId: authorization.context.userId,
      }
    );

    return Response.json(serializeChatListPage(page), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof InvalidChatRequestError) {
      return Response.json(
        { error: "Invalid chat list request." },
        { status: 400 }
      );
    }

    reportUnexpectedServerError(error);
    console.error(
      "Chat list lookup failed.",
      error instanceof Error ? error.message : "Unknown error"
    );
    return Response.json({ error: "Chats are unavailable." }, { status: 500 });
  }
}
