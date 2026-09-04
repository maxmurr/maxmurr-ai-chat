"use client";

import { Fragment, useMemo, useState, useSyncExternalStore } from "react";
import type { ChatStatus } from "ai";
import dynamic from "next/dynamic";
import { MessageCircleIcon } from "lucide-react";

import { ChatPromptNavigation } from "@/features/chat/components/chat-prompt-navigation";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Message, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Spinner } from "@/components/ui/spinner";
import type { ChatDisplayMessage } from "@/src/interface-adapters/presenters/chat-message.presenter";
import { cn } from "@/lib/utils";

const ChatMessageItem = dynamic(() =>
  import("@/features/chat/components/chat-message").then(
    (module) => module.ChatMessageItem
  )
);

const CHAT_SUGGESTIONS = [
  "Why is checkout throwing 500s?",
  "Review our pricing page",
  "Summarise this week's incidents",
] as const;
const CHAT_GREETING_SUBSCRIBE = () => () => {};
const CHAT_GREETING_SERVER_SNAPSHOT = () => "Hello";
const CHAT_TIME_ZONE_SUBSCRIBE = () => () => {};
const CHAT_TIME_ZONE_SERVER_SNAPSHOT = () => "UTC";
const MILLISECONDS_PER_DAY = 86_400_000;

function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function createChatDateFormatters(timeZone: string) {
  return {
    calendarDay: new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "numeric",
      timeZone,
      year: "numeric",
    }),
    date: new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      timeZone,
      year: "numeric",
    }),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }),
  };
}

function getChatCalendarDay(date: Date, formatter: Intl.DateTimeFormat) {
  const parts = formatter.formatToParts(date);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const year = Number(parts.find((part) => part.type === "year")?.value);

  return Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY;
}

function getChatMessageDate(createdAt: string) {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatChatDateMarker(
  date: Date,
  currentDay: number,
  formatters: ReturnType<typeof createChatDateFormatters>
) {
  const dayDifference =
    currentDay - getChatCalendarDay(date, formatters.calendarDay);
  const dateLabel =
    dayDifference === 0
      ? "Today"
      : dayDifference === 1
        ? "Yesterday"
        : formatters.date.format(date);

  return `${dateLabel} ${formatters.time.format(date)}`;
}

type ChatMessageCopyStatus = {
  messageId: string;
  result: "copied" | "error";
} | null;

/** Returns time-aware greeting shown in empty chat state. */
export function getChatGreeting(hour = new Date().getHours()) {
  return hour < 12
    ? "Good morning"
    : hour < 17
      ? "Good afternoon"
      : "Good evening";
}

function ChatEmptyMessageList({
  className,
  greeting,
  onSuggestionSelect,
}: {
  className?: string;
  greeting: string;
  onSuggestionSelect?: (suggestion: string) => void;
}) {
  return (
    <MessageScrollerItem
      className={cn("flex flex-1 items-center", className)}
      messageId="empty-chat"
    >
      <Empty className="w-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageCircleIcon />
          </EmptyMedia>
          <EmptyTitle>{greeting}, shadcn</EmptyTitle>
          <EmptyDescription>
            Ask a question, or start from one of these.
          </EmptyDescription>
        </EmptyHeader>
        {onSuggestionSelect && (
          <EmptyContent>
            <div className="flex flex-wrap justify-center gap-2">
              {CHAT_SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  onClick={() => onSuggestionSelect(suggestion)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </EmptyContent>
        )}
      </Empty>
    </MessageScrollerItem>
  );
}

function ChatPendingResponse({ className }: { className?: string }) {
  return (
    <MessageScrollerItem className={cn(className)} messageId="pending-response">
      <Message align="start">
        <MessageContent>
          <Marker aria-busy="true" className="w-fit">
            <MarkerIcon>
              <Spinner />
            </MarkerIcon>
            <MarkerContent className="shimmer" role="status">
              Thinking...
            </MarkerContent>
          </Marker>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

type ChatMessageListProps = {
  className?: string;
  feedbackChatId?: string;
  isGenerating: boolean;
  messages: readonly ChatDisplayMessage[];
  onEditMessage?: (messageId: string, content: string) => void;
  onRetryMessage?: (messageId: string) => void;
  onSuggestionSelect?: (suggestion: string) => void;
  status: ChatStatus;
  streamingMessageId?: string;
};

/** Renders empty, active, and pending states for current chat conversation. */
export function ChatMessageList({
  className,
  feedbackChatId,
  isGenerating,
  messages,
  onEditMessage,
  onRetryMessage,
  onSuggestionSelect,
  status,
  streamingMessageId,
}: ChatMessageListProps) {
  const [copyStatus, setCopyStatus] = useState<ChatMessageCopyStatus>(null);
  const chatGreeting = useSyncExternalStore(
    CHAT_GREETING_SUBSCRIBE,
    getChatGreeting,
    CHAT_GREETING_SERVER_SNAPSHOT
  );
  const timeZone = useSyncExternalStore(
    CHAT_TIME_ZONE_SUBSCRIBE,
    getBrowserTimeZone,
    CHAT_TIME_ZONE_SERVER_SNAPSHOT
  );
  const dateFormatters = useMemo(
    () => createChatDateFormatters(timeZone),
    [timeZone]
  );
  const currentDay = getChatCalendarDay(new Date(), dateFormatters.calendarDay);
  const datedMessages = messages.map((message) => {
    const date = getChatMessageDate(message.createdAt);
    return {
      calendarDay: getChatCalendarDay(date, dateFormatters.calendarDay),
      date,
      message,
    };
  });

  async function copyChatMessage(message: ChatDisplayMessage) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopyStatus({ messageId: message.id, result: "copied" });
    } catch {
      setCopyStatus({ messageId: message.id, result: "error" });
    }
  }

  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className={cn(className)}>
        <MessageScrollerViewport className="scroll-fade-b-20 focus-visible:outline-none">
          <MessageScrollerContent className="mx-auto w-full max-w-3xl px-4 pb-12">
            {messages.length === 0 ? (
              <ChatEmptyMessageList
                greeting={chatGreeting}
                onSuggestionSelect={onSuggestionSelect}
              />
            ) : (
              <>
                {datedMessages.map(({ calendarDay, date, message }, index) => (
                  <Fragment key={message.id}>
                    {(index === 0 ||
                      calendarDay !== datedMessages[index - 1].calendarDay) && (
                      <MessageScrollerItem
                        messageId={`date-marker-${message.id}`}
                      >
                        <Marker variant="separator">
                          <MarkerContent>
                            {formatChatDateMarker(
                              date,
                              currentDay,
                              dateFormatters
                            )}
                          </MarkerContent>
                        </Marker>
                      </MessageScrollerItem>
                    )}

                    <ChatMessageItem
                      copyResult={
                        copyStatus?.messageId === message.id
                          ? copyStatus.result
                          : null
                      }
                      feedbackChatId={feedbackChatId}
                      hideActions={
                        status === "submitted" &&
                        index === datedMessages.length - 1 &&
                        message.role === "user"
                      }
                      isGenerating={isGenerating}
                      isStreaming={streamingMessageId === message.id}
                      message={message}
                      onCopyMessage={() => void copyChatMessage(message)}
                      onEditMessage={onEditMessage}
                      onRetryMessage={onRetryMessage}
                    />
                  </Fragment>
                ))}

                {status === "submitted" && <ChatPendingResponse />}
              </>
            )}

            <span className="sr-only" role="status">
              {copyStatus?.result === "copied"
                ? "Response copied."
                : copyStatus?.result === "error"
                  ? "Could not copy response."
                  : ""}
            </span>
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <ChatPromptNavigation messages={messages} />
        <MessageScrollerButton className="data-[direction=end]:bottom-12" />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
