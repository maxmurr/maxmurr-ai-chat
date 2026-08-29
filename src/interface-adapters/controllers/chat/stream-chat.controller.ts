import { z } from "zod";

import type { StreamChatResponse } from "@/src/application/services/chat-stream.service.interface";
import { InvalidChatRequestError } from "@/src/entities/errors/chat-errors";
import type { ChatRequestContext } from "@/src/entities/models/chat-stream-request";
import { getLibraryFileIdFromDownloadUrl } from "@/src/entities/models/library";

const chatFilePartSchema = z.object({
  filename: z.string().min(1).max(255),
  mediaType: z.string().min(1).max(200),
  type: z.literal("file"),
  url: z.string().max(500),
});

const chatMessagePartSchema = z
  .object({
    text: z.string().max(100_000).optional(),
    type: z.string().trim().min(1).max(100),
  })
  .catchall(z.unknown())
  .superRefine((part, context) => {
    if (
      (part.type === "text" || part.type === "reasoning") &&
      part.text === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "Text content is required.",
      });
    }

    if (part.type === "file") {
      const fileResult = chatFilePartSchema.safeParse(part);
      const fileId = fileResult.success
        ? getLibraryFileIdFromDownloadUrl(fileResult.data.url)
        : null;

      if (!fileId || !z.uuid().safeParse(fileId).success) {
        context.addIssue({
          code: "custom",
          message: "Library File reference is required.",
        });
      }
    }
  });

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
  projectId: z.uuid().optional(),
  trigger: z.enum(["submit-message", "regenerate-message"]).optional(),
});

/** Validated chat controller resolved by application composition root. */
export type StreamChatController = ReturnType<
  typeof createStreamChatController
>;

/** Creates chat controller that validates untrusted input before provider execution. */
export function createStreamChatController(
  streamChatResponse: StreamChatResponse
) {
  return (
    input: unknown,
    context: ChatRequestContext,
    abortSignal: AbortSignal
  ) => {
    const result = chatStreamRequestSchema.safeParse(input);

    if (!result.success) {
      throw new InvalidChatRequestError({ cause: result.error });
    }

    const { id, message, messageId, projectId, trigger } = result.data;

    return streamChatResponse(
      { chatId: id, message, messageId, projectId, trigger },
      context,
      abortSignal
    );
  };
}
