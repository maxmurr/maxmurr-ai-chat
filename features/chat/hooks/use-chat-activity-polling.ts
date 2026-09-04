"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { ChatConversationEntry } from "@/features/chat/components/chat-conversation-item";

type SerializedChatConversationEntry = Omit<
  ChatConversationEntry,
  "updatedAt"
> & { updatedAt: string };

type ChatActivityPollingProps = {
  activeWorkspaceId: string;
  ownChats: ChatConversationEntry[];
  pathname: string;
};

const ACTIVE_CHAT_ACTIVITY_POLL_INTERVAL_MS = 2_000;
const IDLE_CHAT_ACTIVITY_POLL_INTERVAL_MS = 15_000;

/** Browser event carrying latest owner Chat loading and unread states. */
export const CHAT_ACTIVITY_UPDATED_EVENT = "chat-activity-updated";

/** Detects the open Chat's response stream ending between two activity polls. */
export function hasOpenChatResponseFinished(
  previousChats: ReadonlyArray<
    Pick<ChatConversationEntry, "activeStreamId" | "id" | "updatedAt">
  >,
  nextChats: ReadonlyArray<
    Pick<ChatConversationEntry, "activeStreamId" | "id" | "updatedAt">
  >,
  pathname: string
) {
  const chatId = /^\/chat\/([^/]+)$/.exec(pathname)?.[1];
  const previous = previousChats.find((chat) => chat.id === chatId);
  const next = nextChats.find((chat) => chat.id === chatId);

  return (
    previous !== undefined &&
    next !== undefined &&
    next.activeStreamId === null &&
    (previous.activeStreamId !== null ||
      previous.updatedAt.getTime() !== next.updatedAt.getTime())
  );
}

/** Chooses Chat activity poll delay in milliseconds from active response state. */
export function getChatActivityPollIntervalMs(
  chats: ReadonlyArray<Pick<ChatConversationEntry, "activeStreamId">>
) {
  return chats.some(({ activeStreamId }) => activeStreamId !== null)
    ? ACTIVE_CHAT_ACTIVITY_POLL_INTERVAL_MS
    : IDLE_CHAT_ACTIVITY_POLL_INTERVAL_MS;
}

/** Polls current Workspace Chat activity and refreshes a finished open Chat. */
export function useChatActivityPolling({
  activeWorkspaceId,
  ownChats,
  pathname,
}: ChatActivityPollingProps) {
  const router = useRouter();
  const [polledOwnChats, setPolledOwnChats] = useState<{
    chats: ChatConversationEntry[];
    source: ChatConversationEntry[];
    workspaceId: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    let isPolling = false;
    let pollTimer: number | undefined;
    let latestChats = ownChats;
    const abortController = new AbortController();

    function scheduleNextChatActivityPoll() {
      window.clearTimeout(pollTimer);
      pollTimer = window.setTimeout(
        () => void refreshChatActivity(),
        getChatActivityPollIntervalMs(latestChats)
      );
    }

    async function refreshChatActivity() {
      if (document.visibilityState !== "visible" || isPolling) {
        return;
      }

      isPolling = true;
      try {
        const response = await fetch("/api/chat/activity", {
          signal: abortController.signal,
        });

        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as {
          chats?: SerializedChatConversationEntry[];
        };

        if (!isMounted || !Array.isArray(result.chats)) {
          return;
        }

        const previousChats = latestChats;
        latestChats = result.chats.map((chat) => ({
          ...chat,
          updatedAt: new Date(chat.updatedAt),
        }));
        window.dispatchEvent(
          new CustomEvent(CHAT_ACTIVITY_UPDATED_EVENT, { detail: latestChats })
        );
        // A response finished elsewhere (Slack, another tab): reload the open Chat once it is idle.
        if (hasOpenChatResponseFinished(previousChats, latestChats, pathname)) {
          router.refresh();
        }
        setPolledOwnChats({
          chats: latestChats,
          source: ownChats,
          workspaceId: activeWorkspaceId,
        });
      } catch {
        // Keep server-rendered history when background status refresh fails.
      } finally {
        isPolling = false;
        if (isMounted) scheduleNextChatActivityPoll();
      }
    }

    function refreshVisibleChatActivity() {
      if (document.visibilityState !== "visible") return;

      window.clearTimeout(pollTimer);
      void refreshChatActivity();
    }

    void refreshChatActivity();
    document.addEventListener("visibilitychange", refreshVisibleChatActivity);
    window.addEventListener("focus", refreshVisibleChatActivity);

    return () => {
      isMounted = false;
      abortController.abort();
      window.clearTimeout(pollTimer);
      document.removeEventListener(
        "visibilitychange",
        refreshVisibleChatActivity
      );
      window.removeEventListener("focus", refreshVisibleChatActivity);
    };
  }, [activeWorkspaceId, ownChats, pathname, router]);

  return polledOwnChats?.workspaceId === activeWorkspaceId &&
    polledOwnChats.source === ownChats
    ? polledOwnChats.chats
    : ownChats;
}
