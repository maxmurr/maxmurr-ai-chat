import { z } from "zod"

import type { StreamChatResponse } from "@/src/application/services/chat-stream.service.interface"
import { InvalidChatRequestError } from "@/src/entities/errors/chat-errors"

const chatMessagePartSchema = z
  .object({
    text: z.string().max(100_000).optional(),
    type: z.string().trim().min(1).max(100),
  })
  .catchall(z.unknown())
  .refine(
    ({ text, type }) =>
      (type !== "text" && type !== "reasoning") || text !== undefined,
    { message: "Text content is required." }
  )

const chatStreamRequestSchema = z.object({
  messages: z
    .array(
      z
        .object({
          id: z.string().min(1).max(200),
          parts: z.array(chatMessagePartSchema).min(1).max(100),
          role: z.enum(["system", "user", "assistant"]),
        })
        .catchall(z.unknown())
    )
    .min(1)
    .max(100),
  trigger: z.enum(["submit-message", "regenerate-message"]).optional(),
})

/** Validated chat controller resolved by application composition root. */
export type StreamChatController = ReturnType<typeof createStreamChatController>

/** Creates chat controller that validates untrusted input before provider execution. */
export function createStreamChatController(
  streamChatResponse: StreamChatResponse
) {
  return (input: unknown, abortSignal: AbortSignal) => {
    const result = chatStreamRequestSchema.safeParse(input)

    if (!result.success) {
      throw new InvalidChatRequestError({ cause: result.error })
    }

    return streamChatResponse(result.data, abortSignal)
  }
}
