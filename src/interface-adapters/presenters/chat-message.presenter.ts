import { getToolName, isToolUIPart, type UIMessage } from "ai";

import { getLibraryFileIdFromDownloadUrl } from "@/src/entities/models/library";

const LANGFUSE_TRACE_ID_PATTERN = /^[0-9a-f]{32}$/;

/** Describes one file shown with a chat message. */
export type ChatDisplayAttachment = {
  readonly filename: string;
  readonly href?: string;
  readonly id: string;
  readonly isAvailable: boolean;
  readonly mediaType: string;
};

/** Describes reasoning activity shown with a chat message. */
export type ChatDisplayReasoning = {
  readonly state: "running" | "completed";
  readonly text: string;
};

/** Describes one source cited by a chat message. */
export type ChatDisplaySource = {
  readonly href?: string;
  readonly label: string;
  readonly title: string;
};

/** Describes one tool call shown with a chat message. */
export type ChatDisplayTool = {
  readonly id: string;
  readonly name: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly state: "running" | "completed" | "failed";
};

/** Presentation model derived from an AI SDK chat message. */
export type ChatDisplayMessage = {
  readonly attachments?: readonly ChatDisplayAttachment[];
  readonly content: string;
  readonly createdAt: string;
  readonly feedbackEnabled?: boolean;
  readonly id: string;
  readonly reasoning?: ChatDisplayReasoning;
  readonly role: "assistant" | "user";
  readonly sources?: readonly ChatDisplaySource[];
  readonly tools?: readonly ChatDisplayTool[];
};

/** Client metadata for message creation time, feedback trace, and File presentation. */
export type ChatMessageMetadata = {
  readonly attachments?: readonly {
    readonly filename: string;
    readonly mediaType: string;
  }[];
  readonly createdAt?: string;
  readonly langfuseTraceId?: string;
  readonly libraryFileAvailability?: Readonly<Record<string, boolean>>;
};

/** AI SDK message shape shared by chat store and Mastra route. */
export type ChatUIMessage = UIMessage<ChatMessageMetadata>;

function getChatSourceLabel(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getChatMessageCreatedAt(metadata?: ChatMessageMetadata) {
  const createdAt = metadata?.createdAt;
  return createdAt && !Number.isNaN(Date.parse(createdAt))
    ? createdAt
    : new Date().toISOString();
}

/** Adapts AI SDK stream parts to existing chat presentation model. */
export function convertChatUiMessageToDisplayMessage(
  message: ChatUIMessage
): ChatDisplayMessage | null {
  if (message.role === "system") {
    return null;
  }

  const text = message.parts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n\n");
  const reasoningParts = message.parts.flatMap((part) =>
    part.type === "reasoning" ? [part] : []
  );
  const reasoningText = reasoningParts
    .map(({ text }) => text)
    .filter(Boolean)
    .join("\n\n");
  const isReasoningRunning = reasoningParts.some(
    ({ state }) => state === "streaming"
  );
  const attachments: ChatDisplayAttachment[] = [
    ...(message.metadata?.attachments ?? []).map((attachment, index) => ({
      ...attachment,
      id: `${message.id}-legacy-file-${index}`,
      isAvailable: false,
    })),
    ...message.parts.flatMap((part, index) => {
      if (part.type !== "file") {
        return [];
      }

      const libraryFileId = getLibraryFileIdFromDownloadUrl(part.url);
      const isAvailable = libraryFileId
        ? message.metadata?.libraryFileAvailability?.[libraryFileId] !== false
        : true;

      return [
        {
          filename: part.filename ?? "Attachment",
          ...(isAvailable ? { href: part.url } : {}),
          id: libraryFileId ?? `${message.id}-file-${index}`,
          isAvailable,
          mediaType: part.mediaType,
        },
      ];
    }),
  ];
  const sources = message.parts.flatMap((part): ChatDisplaySource[] => {
    if (part.type === "source-url") {
      return [
        {
          href: part.url,
          label: getChatSourceLabel(part.url),
          title: part.title ?? part.url,
        },
      ];
    }

    if (part.type === "source-document") {
      return [
        {
          label: part.filename ?? part.mediaType,
          title: part.title,
        },
      ];
    }

    return [];
  });
  const tools = message.parts.flatMap((part): ChatDisplayTool[] => {
    if (!isToolUIPart(part)) {
      return [];
    }

    const state =
      part.state === "output-available"
        ? "completed"
        : part.state === "output-error" || part.state === "output-denied"
          ? "failed"
          : "running";
    const payload =
      part.state === "output-available"
        ? { input: part.input, output: part.output }
        : part.state === "output-error"
          ? { error: part.errorText, input: part.input }
          : part.state === "output-denied"
            ? {
                error: part.approval.reason ?? "Tool execution denied.",
                input: part.input,
              }
            : { input: part.input };

    return [
      {
        id: part.toolCallId,
        name: getToolName(part),
        payload,
        state,
      },
    ];
  });

  return {
    content: text,
    createdAt: getChatMessageCreatedAt(message.metadata),
    ...(message.metadata?.langfuseTraceId &&
    LANGFUSE_TRACE_ID_PATTERN.test(message.metadata.langfuseTraceId)
      ? { feedbackEnabled: true }
      : {}),
    id: message.id,
    role: message.role,
    ...(attachments.length > 0 ? { attachments } : {}),
    // Providers can emit reasoning items with hidden content; a finished,
    // textless reasoning block has nothing to show.
    ...(isReasoningRunning || reasoningText
      ? {
          reasoning: {
            state: isReasoningRunning ? "running" : "completed",
            text: reasoningText,
          },
        }
      : {}),
    ...(sources.length > 0 ? { sources } : {}),
    ...(tools.length > 0 ? { tools } : {}),
  };
}
