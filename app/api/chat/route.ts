import { resolveApplicationDependency } from "@/di/application-container"
import { auth } from "@/di/authentication"
import { resolveActiveWorkspaceId } from "@/lib/active-workspace"
import { applicationInjectionTokens } from "@/di/application-container.registry"
import {
  ChatAccessDeniedError,
  ChatUnavailableError,
  InvalidChatRequestError,
} from "@/src/entities/errors/chat-errors"
import type { ChatRequestContext } from "@/src/entities/models/chat-stream-request"

export const runtime = "nodejs"
export const maxDuration = 60

function invalidChatRequestResponse() {
  return Response.json({ error: "Invalid chat request." }, { status: 400 })
}

/** Streams authenticated, validated chat messages through configured controller. */
export async function POST(request: Request) {
  let body: unknown
  let context: ChatRequestContext

  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return Response.json({ error: "Unauthorized." }, { status: 401 })
    }

    const organizations = await auth.api.listOrganizations({
      headers: request.headers,
    })
    const organizationId = resolveActiveWorkspaceId(
      organizations,
      session.session.activeOrganizationId
    )

    if (!organizationId) {
      return Response.json({ error: "Workspace is required." }, { status: 403 })
    }

    context = { organizationId, userId: session.user.id }
  } catch (error) {
    console.error(
      "Chat authorization failed.",
      error instanceof Error ? error.message : "Unknown error"
    )
    return Response.json(
      { error: "Authorization is unavailable." },
      { status: 503 }
    )
  }

  try {
    body = await request.json()
  } catch {
    return invalidChatRequestResponse()
  }

  try {
    const streamChatController = resolveApplicationDependency(
      applicationInjectionTokens.streamChatController
    )
    return await streamChatController(body, context, request.signal)
  } catch (error) {
    if (error instanceof InvalidChatRequestError) {
      return invalidChatRequestResponse()
    }

    if (error instanceof ChatAccessDeniedError) {
      return Response.json({ error: "Chat not found." }, { status: 404 })
    }

    const cause = error instanceof ChatUnavailableError ? error.cause : error
    console.error(
      "Chat route setup failed.",
      cause instanceof Error ? cause.message : "Unknown error"
    )
    return Response.json({ error: "Chat is unavailable." }, { status: 500 })
  }
}
