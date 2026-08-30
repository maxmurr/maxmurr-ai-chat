"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LangfuseClient } from "@langfuse/client";
import { z } from "zod";

import { resolveApplicationDependency } from "@/di/application-container";
import { applicationInjectionTokens } from "@/di/application-container.registry";
import { auth } from "@/di/authentication";
import { chatFeedbackReasons } from "@/features/chat/chat-feedback";
import { getWorkspaceOwnerScope } from "@/features/workspace/workspace-queries";
import { reportUnexpectedServerError } from "@/lib/server-error-reporting";
import { traceServerAction } from "@/lib/server-action-tracing";
import {
  ChatAccessDeniedError,
  ChatStreamConflictError,
  InvalidChatRequestError,
} from "@/src/entities/errors/chat-errors";
import type { ChatVisibility } from "@/src/entities/models/chat";

const chatIdSchema = z.uuid();
const chatMessageIdSchema = z.string().min(1).max(200);
const chatResponseFeedbackSchema = z
  .object({
    chatId: chatIdSchema,
    details: z.string().trim().max(500).optional(),
    messageId: chatMessageIdSchema,
    reasons: z
      .array(z.enum(chatFeedbackReasons))
      .max(chatFeedbackReasons.length),
    value: z.enum(["negative", "positive"]).nullable(),
  })
  .superRefine((feedback, context) => {
    if (feedback.value === "negative" && feedback.reasons.length === 0) {
      context.addIssue({
        code: "custom",
        message: "Choose at least one feedback reason.",
        path: ["reasons"],
      });
    }
  });

let langfuseClient: LangfuseClient | undefined;

function getLangfuseClient() {
  langfuseClient ??= new LangfuseClient();
  return langfuseClient;
}

/** Waits for async score ingestion so a following delete cannot be undone. */
async function waitForLangfuseFeedbackScore(
  client: LangfuseClient,
  scoreId: string,
  submissionId: string
) {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const scores = await client.api.scoresV3.getManyV3({
      fields: "details",
      id: scoreId,
    });

    if (
      scores.data.some((score) => score.metadata?.submissionId === submissionId)
    ) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error("Langfuse feedback score did not settle.");
}

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  return session.user.id;
}

function chatLibrary() {
  return resolveApplicationDependency(
    applicationInjectionTokens.chatLibraryController
  );
}

function reportUnexpectedChatActionError(error: unknown) {
  if (
    !(error instanceof ChatAccessDeniedError) &&
    !(error instanceof InvalidChatRequestError)
  ) {
    reportUnexpectedServerError(error);
  }
}

/** Creates, replaces, or removes owner feedback for one traced response. */
export async function updateChatResponseFeedbackAction(input: unknown) {
  return traceServerAction("updateChatResponseFeedbackAction", async () => {
    const parsedFeedback = chatResponseFeedbackSchema.safeParse(input);

    if (!parsedFeedback.success) {
      return { error: "Could not send feedback.", ok: false as const };
    }

    const userId = await requireUserId();

    try {
      const { chatId, details, messageId, reasons, value } =
        parsedFeedback.data;
      const traceId =
        await chatLibrary().getOwnedAssistantMessageLangfuseTraceId(
          chatId,
          userId,
          messageId
        );
      const client = getLangfuseClient();
      const scoreId = `${traceId}-user-thumbs`;

      if (value === null) {
        await client.api.legacy.scoreV1.delete(scoreId);
        return { ok: true as const };
      }

      const comment = [reasons.join(", "), details]
        .filter(Boolean)
        .join("\n\n");
      const submissionId = crypto.randomUUID();

      await client.api.scores.create({
        comment: comment || undefined,
        dataType: "BOOLEAN",
        environment: process.env.NODE_ENV,
        id: scoreId,
        metadata: { chatId, messageId, reasons, submissionId },
        name: "user-thumbs",
        traceId,
        value: value === "positive" ? 1 : 0,
      });
      await waitForLangfuseFeedbackScore(client, scoreId, submissionId);

      return { ok: true as const };
    } catch (error) {
      reportUnexpectedChatActionError(error);
      return { error: "Could not send feedback.", ok: false as const };
    }
  });
}

/** Sets who can see a chat and returns the public token when one exists. */
export async function updateChatSharingAction(
  chatId: unknown,
  visibility: ChatVisibility
): Promise<
  | { ok: true; publicToken: string | null; visibility: ChatVisibility }
  | { error: string; ok: false }
> {
  return traceServerAction("updateChatSharingAction", async () => {
    const parsedChatId = chatIdSchema.safeParse(chatId);

    if (!parsedChatId.success) {
      return { error: "Send a message first, then share the chat.", ok: false };
    }

    const userId = await requireUserId();

    try {
      const sharing = await chatLibrary().updateChatSharing(
        parsedChatId.data,
        userId,
        visibility
      );
      refresh();
      return { ok: true, ...sharing };
    } catch (error) {
      reportUnexpectedChatActionError(error);
      return { error: "Send a message first, then share the chat.", ok: false };
    }
  });
}

/** Clears owner unread state for the latest visible assistant response. */
export async function markChatReadAction(
  chatId: unknown,
  assistantMessageId: unknown
) {
  return traceServerAction("markChatReadAction", async () => {
    const parsedChatId = chatIdSchema.safeParse(chatId);
    const parsedMessageId = chatMessageIdSchema.safeParse(assistantMessageId);

    if (!parsedChatId.success || !parsedMessageId.success) {
      return { error: "Could not mark chat read.", ok: false as const };
    }

    const workspace = await getWorkspaceOwnerScope(await headers());

    if (workspace.status !== "authorized") {
      return { error: "Could not mark chat read.", ok: false as const };
    }

    try {
      await chatLibrary().markChatRead(
        parsedChatId.data,
        workspace.scope.ownerId,
        workspace.scope.organizationId,
        parsedMessageId.data
      );
      return { ok: true as const };
    } catch (error) {
      reportUnexpectedChatActionError(error);
      return { error: "Could not mark chat read.", ok: false as const };
    }
  });
}

/** Sets owner chat pin after validating action input. */
export async function pinChatAction(chatId: unknown, pinned: unknown) {
  return traceServerAction("pinChatAction", async () => {
    const parsedChatId = chatIdSchema.safeParse(chatId);

    if (!parsedChatId.success || typeof pinned !== "boolean") {
      return { error: "Could not update pin.", ok: false as const };
    }

    const userId = await requireUserId();

    try {
      await chatLibrary().pinChat(parsedChatId.data, userId, pinned);
      refresh();
      return { ok: true as const };
    } catch (error) {
      reportUnexpectedChatActionError(error);
      return { error: "Could not update pin.", ok: false as const };
    }
  });
}

/** Renames owner chat after validating chat identity and title in controller. */
export async function renameChatAction(chatId: unknown, title: unknown) {
  return traceServerAction("renameChatAction", async () => {
    const parsedChatId = chatIdSchema.safeParse(chatId);

    if (!parsedChatId.success) {
      return { error: "Could not rename chat.", ok: false as const };
    }

    const userId = await requireUserId();

    try {
      await chatLibrary().renameChat(parsedChatId.data, userId, title);
      refresh();
      return { ok: true as const };
    } catch (error) {
      reportUnexpectedChatActionError(error);
      return { error: "Could not rename chat.", ok: false as const };
    }
  });
}

/** Deletes owner chat after validating chat identity. */
export async function deleteChatAction(chatId: unknown) {
  return traceServerAction("deleteChatAction", async () => {
    const parsedChatId = chatIdSchema.safeParse(chatId);

    if (!parsedChatId.success) {
      return { error: "Could not delete chat.", ok: false as const };
    }

    const userId = await requireUserId();

    try {
      await chatLibrary().deleteChat(parsedChatId.data, userId);
      refresh();
      return { ok: true as const };
    } catch (error) {
      if (error instanceof ChatStreamConflictError) {
        return {
          error: "Stop the response before deleting this chat.",
          ok: false as const,
        };
      }

      reportUnexpectedChatActionError(error);
      return { error: "Could not delete chat.", ok: false as const };
    }
  });
}
