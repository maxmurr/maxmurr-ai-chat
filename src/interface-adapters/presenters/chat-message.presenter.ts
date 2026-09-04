import { getToolName, isToolUIPart, type UIMessage } from "ai";

import {
  isChatMessageSender,
  type ChatMessageSender,
} from "@/src/entities/models/chat";
import { getLibraryFileIdFromDownloadUrl } from "@/src/entities/models/library";

const LANGFUSE_TRACE_ID_PATTERN = /^[0-9a-f]{32}$/;
const WEB_SEARCH_TOOL_NAME = "webSearch";

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

/** Describes one web search shown with a chat message. */
export type ChatDisplayWebSearch = {
  readonly id: string;
  readonly query?: string;
  readonly status: "failed" | "searched" | "searching";
};

/** Describes one tool call shown with a chat message. */
export type ChatDisplayTool = {
  readonly id: string;
  readonly name: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly state: "running" | "completed" | "failed";
};

/** Sender profile shown beside a user Message. */
export type ChatDisplayMessageSender = {
  readonly avatarUrl?: string;
  readonly displayName: string;
  readonly initials: string;
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
  readonly sender?: ChatDisplayMessageSender;
  readonly sources?: readonly ChatDisplaySource[];
  readonly tools?: readonly ChatDisplayTool[];
  readonly webSearches?: readonly ChatDisplayWebSearch[];
};

/** Client metadata for creation time, sender identity, feedback, and File presentation. */
export type ChatMessageMetadata = {
  readonly attachments?: readonly {
    readonly filename: string;
    readonly mediaType: string;
  }[];
  /** Legacy Slack author name retained for existing Messages. */
  readonly author?: string;
  readonly createdAt?: string;
  readonly langfuseTraceId?: string;
  readonly libraryFileAvailability?: Readonly<Record<string, boolean>>;
  readonly sender?: ChatMessageSender;
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

function getWebSearchSources(output: unknown): ChatDisplaySource[] {
  if (
    typeof output !== "object" ||
    output === null ||
    !("results" in output) ||
    !Array.isArray(output.results)
  ) {
    return [];
  }

  return output.results.flatMap((result): ChatDisplaySource[] => {
    if (
      typeof result !== "object" ||
      result === null ||
      !("title" in result) ||
      typeof result.title !== "string" ||
      !("url" in result) ||
      typeof result.url !== "string"
    ) {
      return [];
    }

    try {
      const url = new URL(result.url);
      if (url.protocol !== "http:" && url.protocol !== "https:") return [];

      return [{ href: result.url, label: url.hostname, title: result.title }];
    } catch {
      return [];
    }
  });
}

function getWebSearchQuery(input: unknown) {
  if (
    typeof input !== "object" ||
    input === null ||
    !("query" in input) ||
    typeof input.query !== "string"
  ) {
    return undefined;
  }

  return input.query.trim() || undefined;
}

function getChatMessageCreatedAt(metadata?: ChatMessageMetadata) {
  const createdAt = metadata?.createdAt;
  return createdAt && !Number.isNaN(Date.parse(createdAt))
    ? createdAt
    : new Date().toISOString();
}

function getChatMessageSenderInitials(displayName: string) {
  return displayName.slice(0, 2).toUpperCase();
}

function getChatDisplayMessageSender(
  metadata: unknown
): ChatDisplayMessageSender {
  if (typeof metadata === "object" && metadata !== null) {
    const values = metadata as Record<string, unknown>;

    if (isChatMessageSender(values.sender)) {
      const displayName = values.sender.displayName.trim();
      return {
        ...(values.sender.avatarUrl
          ? { avatarUrl: values.sender.avatarUrl }
          : {}),
        displayName,
        initials: getChatMessageSenderInitials(displayName),
      };
    }

    if (typeof values.author === "string" && values.author.trim()) {
      const displayName = values.author.trim();
      return {
        displayName,
        initials: getChatMessageSenderInitials(displayName),
      };
    }
  }

  return { displayName: "User", initials: "US" };
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
  const sourceUrls = new Set<string>();
  const sources = message.parts
    .flatMap((part): ChatDisplaySource[] => {
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

      if (
        isToolUIPart(part) &&
        getToolName(part) === WEB_SEARCH_TOOL_NAME &&
        part.state === "output-available"
      ) {
        return getWebSearchSources(part.output);
      }

      return [];
    })
    .filter((source) => {
      if (!source.href) return true;
      if (sourceUrls.has(source.href)) return false;
      sourceUrls.add(source.href);
      return true;
    });
  const webSearches = message.parts.flatMap((part): ChatDisplayWebSearch[] => {
    if (!isToolUIPart(part) || getToolName(part) !== WEB_SEARCH_TOOL_NAME) {
      return [];
    }

    const query = getWebSearchQuery(part.input);
    const status =
      part.state === "output-available"
        ? "searched"
        : part.state === "output-error" || part.state === "output-denied"
          ? "failed"
          : "searching";

    return [
      {
        id: part.toolCallId,
        ...(query ? { query } : {}),
        status,
      },
    ];
  });
  const tools = message.parts.flatMap((part): ChatDisplayTool[] => {
    if (!isToolUIPart(part) || getToolName(part) === WEB_SEARCH_TOOL_NAME) {
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
    ...(message.role === "user"
      ? { sender: getChatDisplayMessageSender(message.metadata) }
      : {}),
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
    ...(webSearches.length > 0 ? { webSearches } : {}),
  };
}
