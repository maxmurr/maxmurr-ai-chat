import { z } from "zod"

import type { StreamChatResponse } from "@/src/application/services/chat-stream.service.interface"
import { InvalidChatRequestError } from "@/src/entities/errors/chat-errors"
import type { ChatRequestContext } from "@/src/entities/models/chat-stream-request"

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
  id: z.uuid(),
  message: z
    .object({
      id: z.string().min(1).max(200),
      parts: z.array(chatMessagePartSchema).min(1).max(100),
      role: z.literal("user"),
    })
    .catchall(z.unknown()),
  messageId: z.string().min(1).max(200).optional(),
  trigger: z.enum(["submit-message", "regenerate-message"]).optional(),
})

/** Validated chat controller resolved by application composition root. */
export type StreamChatController = ReturnType<typeof createStreamChatController>

/** Creates chat controller that validates untrusted input before provider execution. */
export function createStreamChatController(
  streamChatResponse: StreamChatResponse
) {
  return (
    input: unknown,
    context: ChatRequestContext,
    abortSignal: AbortSignal
  ) => {
    const result = chatStreamRequestSchema.safeParse(input)

    if (!result.success) {
      throw new InvalidChatRequestError({ cause: result.error })
    }

    const { id, message, messageId, trigger } = result.data

    return streamChatResponse(
      { chatId: id, message, messageId, trigger },
      context,
      abortSignal
    )
  }
}
