import { resolveApplicationDependency } from "@/di/application-container"
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

/** Streams validated chat messages through configured chat controller. */
export async function POST(request: Request) {
  let body: unknown

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
