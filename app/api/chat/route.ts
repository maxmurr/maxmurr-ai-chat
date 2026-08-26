import { resolveApplicationDependency } from "@/di/application-container"
import { auth } from "@/di/authentication"
import { applicationInjectionTokens } from "@/di/application-container.registry"
import {
  ChatUnavailableError,
  InvalidChatRequestError,
} from "@/src/entities/errors/chat-errors"

export const runtime = "nodejs"
export const maxDuration = 60

function invalidChatRequestResponse() {
  return Response.json({ error: "Invalid chat request." }, { status: 400 })
}

/** Streams authenticated, validated chat messages through configured controller. */
export async function POST(request: Request) {
  let body: unknown

  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return Response.json({ error: "Unauthorized." }, { status: 401 })
    }
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
    return await streamChatController(body, request.signal)
  } catch (error) {
    if (error instanceof InvalidChatRequestError) {
      return invalidChatRequestResponse()
    }

    const cause = error instanceof ChatUnavailableError ? error.cause : error
    console.error(
      "Chat route setup failed.",
      cause instanceof Error ? cause.message : "Unknown error"
    )
    return Response.json({ error: "Chat is unavailable." }, { status: 500 })
  }
}
