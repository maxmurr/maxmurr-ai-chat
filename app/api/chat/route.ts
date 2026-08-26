import { handleChatStream } from "@mastra/ai-sdk"
import { createUIMessageStreamResponse, type UIMessage } from "ai"
import { z } from "zod"

import { mastra } from "@/mastra"

const chatMessagePartSchema = z
  .looseObject({
    text: z.string().max(100_000).optional(),
    type: z.string().trim().min(1).max(100),
  })
  .refine(
    ({ text, type }) =>
      (type !== "text" && type !== "reasoning") || text !== undefined,
    { message: "Text content is required." }
  )

const chatApiRequestSchema = z.object({
  messages: z
    .array(
      z.looseObject({
        id: z.string().min(1).max(200),
        parts: z.array(chatMessagePartSchema).min(1).max(100),
        role: z.enum(["system", "user", "assistant"]),
      })
    )
    .min(1)
    .max(100),
  trigger: z.enum(["submit-message", "regenerate-message"]).optional(),
})

type ChatApiRequest = {
  messages: UIMessage[]
  trigger?: "submit-message" | "regenerate-message"
}

/** Validates untrusted AI SDK chat request bodies before model execution. */
export function parseChatApiRequest(input: unknown): ChatApiRequest | null {
  const result = chatApiRequestSchema.safeParse(input)

  if (!result.success) {
    return null
  }

  return {
    messages: result.data.messages as unknown as UIMessage[],
    ...(result.data.trigger ? { trigger: result.data.trigger } : {}),
  }
}

export const runtime = "nodejs"
export const maxDuration = 60

/** Streams validated chat messages through registered Mastra assistant. */
export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid chat request." }, { status: 400 })
  }

  const params = parseChatApiRequest(body)

  if (!params) {
    return Response.json({ error: "Invalid chat request." }, { status: 400 })
  }

  try {
    const stream = await handleChatStream({
      agentId: "chat-assistant",
      mastra,
      onError: (error) => {
        console.error(
          "Chat stream failed.",
          error instanceof Error ? error.message : "Unknown error"
        )
        return "Chat response failed."
      },
      params: {
        ...params,
        abortSignal: request.signal,
      },
      sendReasoning: true,
      sendSources: true,
      version: "v5",
    })

    return createUIMessageStreamResponse({ stream })
  } catch (error) {
    console.error(
      "Chat route setup failed.",
      error instanceof Error ? error.message : "Unknown error"
    )
    return Response.json({ error: "Chat is unavailable." }, { status: 500 })
  }
}
