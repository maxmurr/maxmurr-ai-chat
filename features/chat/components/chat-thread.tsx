"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import { CircleAlertIcon } from "lucide-react";

import { markChatReadAction } from "@/features/chat/chat-actions";
import {
  ChatComposer,
  type ChatComposerSubmission,
} from "@/features/chat/components/chat-composer";
import { useChatConversationTitle } from "@/features/chat/components/chat-conversation-title";
import { ChatFooterNotice } from "@/features/chat/components/chat-footer-notice";
import { ChatMessageList } from "@/features/chat/components/chat-message-list";
import { takePendingProjectChat } from "@/features/chat/pending-project-chat";
import { uploadLibraryFiles } from "@/features/library/components/upload-library-files";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  convertChatUiMessageToDisplayMessage,
  type ChatUIMessage,
} from "@/src/interface-adapters/presenters/chat-message.presenter";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { createLibraryFileDownloadUrl } from "@/src/entities/models/library";

const CHAT_TRANSPORT = new DefaultChatTransport<ChatUIMessage>({
  api: "/api/chat",
  // The server owns chat history; each request carries only the new turn.
  prepareSendMessagesRequest: ({ body, id, messageId, messages, trigger }) => ({
    body: { ...body, id, message: messages.at(-1), messageId, trigger },
  }),
});

type ChatThreadProps = {
  activeStreamId: string | null;
  chatId: string;
  className?: string;
  initialMessages?: ChatUIMessage[];
};

function isCurrentChatRoute(chatId: string) {
  return window.location.pathname === `/chat/${chatId}`;
}

function canMarkCurrentChatRead(chatId: string) {
  return (
    document.visibilityState === "visible" &&
    document.hasFocus() &&
    isCurrentChatRoute(chatId)
  );
}

/** Routes uploads after a Chat exists locally or has loaded from persistence. */
export function resolveChatFileUploadDestination(
  chatId: string,
  hasLoadedChat: boolean,
  localMessageCount: number
) {
  return hasLoadedChat || localMessageCount > 0 ? { chatId } : undefined;
}

/** Renders current live chat conversation. */
export function ChatThread({
  activeStreamId,
  chatId,
  className,
  initialMessages,
}: ChatThreadProps) {
  return (
    <ChatThreadContent
      activeStreamId={activeStreamId}
      chatId={chatId}
      className={className}
      initialMessages={initialMessages}
      key={`${chatId}:${activeStreamId ?? "idle"}:${initialMessages?.at(-1)?.id ?? "empty"}`}
    />
  );
}

function ChatThreadContent({
  activeStreamId,
  chatId,
  className,
  initialMessages,
}: ChatThreadProps) {
  const router = useRouter();
  const activeStreamIdRef = useRef(activeStreamId);
  const chatFinishEventCountRef = useRef(0);
  const [activeResponseStreamId, setActiveResponseStreamId] =
    useState(activeStreamId);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [composerAnnouncement, setComposerAnnouncement] = useState("");
  const [draft, setDraft] = useState("");

  function updateActiveResponseStreamId(streamId: string | null) {
    activeStreamIdRef.current = streamId;
    setActiveResponseStreamId(streamId);
  }

  const {
    clearError,
    error,
    messages: chatMessages,
    regenerate,
    resumeStream,
    sendMessage,
    status,
    stop,
  } = useChat<ChatUIMessage>({
    id: chatId,
    messages: initialMessages,
    onFinish: ({ isAbort, isDisconnect, isError, message }) => {
      chatFinishEventCountRef.current += 1;
      const responseCompleted = !isAbort && !isDisconnect && !isError;

      if (!isCurrentChatRoute(chatId)) return;

      if (!isDisconnect) {
        updateActiveResponseStreamId(null);
      }

      if (responseCompleted && canMarkCurrentChatRead(chatId)) {
        void markChatReadAction(chatId, message.id);
      }
      router.refresh();
    },
    resume: activeStreamId !== null,
    transport: CHAT_TRANSPORT,
  });
  const messages = chatMessages.flatMap((message) => {
    const displayMessage = convertChatUiMessageToDisplayMessage(message);
    return displayMessage ? [displayMessage] : [];
  });
  const { conversationTitle, setConversationTitle } =
    useChatConversationTitle();
  const isGenerating =
    activeResponseStreamId !== null ||
    status === "submitted" ||
    status === "streaming";
  const streamingMessageId =
    status === "streaming" ? chatMessages.at(-1)?.id : undefined;

  async function sendChatMessage(
    { attachments, text }: ChatComposerSubmission,
    projectId?: string
  ) {
    if (
      activeStreamIdRef.current ||
      isGenerating ||
      (!text && attachments.length === 0)
    ) {
      return;
    }

    clearError();
    setComposerAnnouncement("");

    try {
      const uploadedFiles =
        attachments.length > 0
          ? await uploadLibraryFiles(
              attachments,
              resolveChatFileUploadDestination(
                chatId,
                initialMessages !== undefined,
                chatMessages.length
              )
            )
          : [];
      const fileParts: FileUIPart[] = uploadedFiles.map((file) => ({
        filename: file.name,
        mediaType: file.mediaType,
        type: "file",
        url: createLibraryFileDownloadUrl(file.id),
      }));
      const messageId = crypto.randomUUID();
      const streamId = crypto.randomUUID();

      if (messages.length === 0) {
        setConversationTitle(text || uploadedFiles[0]?.name || "New chat");
        window.history.replaceState(null, "", `/chat/${chatId}`);
      }

      setAttachments([]);
      setDraft("");
      updateActiveResponseStreamId(streamId);

      await sendMessage(
        {
          id: messageId,
          metadata: { createdAt: new Date().toISOString() },
          parts: [
            ...fileParts,
            ...(text ? [{ text, type: "text" as const }] : []),
          ],
          role: "user",
        },
        { body: { ...(projectId ? { projectId } : {}), streamId } }
      );
    } catch (error) {
      updateActiveResponseStreamId(null);
      const description =
        error instanceof Error ? error.message : "Could not send message.";
      setComposerAnnouncement(description);
      toast.add({
        description,
        title: attachments.length > 0 ? "File send failed" : "Message failed",
        type: "error",
      });
    }
  }

  const sendPendingProjectChat = useEffectEvent(
    (pendingProjectChat: { projectId: string; text: string }) =>
      void sendChatMessage(
        { attachments: [], text: pendingProjectChat.text },
        pendingProjectChat.projectId
      )
  );

  const markLatestAssistantResponseRead = useEffectEvent(() => {
    if (!canMarkCurrentChatRead(chatId)) return;

    const assistantMessage = chatMessages.findLast(
      (message) => message.role === "assistant"
    );

    if (assistantMessage) {
      void markChatReadAction(chatId, assistantMessage.id);
    }
  });

  useEffect(() => {
    markLatestAssistantResponseRead();
    window.addEventListener("focus", markLatestAssistantResponseRead);
    document.addEventListener(
      "visibilitychange",
      markLatestAssistantResponseRead
    );
    return () => {
      window.removeEventListener("focus", markLatestAssistantResponseRead);
      document.removeEventListener(
        "visibilitychange",
        markLatestAssistantResponseRead
      );
    };
  }, [chatId]);

  useEffect(() => {
    if (!activeStreamId || status === "submitted" || status === "streaming") {
      return;
    }

    let isMounted = true;
    let isReconciling = false;
    const reconcile = async () => {
      if (isReconciling || document.visibilityState !== "visible") {
        return;
      }

      isReconciling = true;
      try {
        await resumeStream();
      } finally {
        if (isMounted) {
          isReconciling = false;
          router.refresh();
        }
      }
    };
    const interval = window.setInterval(() => void reconcile(), 5_000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [activeStreamId, resumeStream, router, status]);

  useEffect(() => {
    const sendTimer = window.setTimeout(() => {
      const pendingProjectChat = takePendingProjectChat(window.sessionStorage);
      if (pendingProjectChat) sendPendingProjectChat(pendingProjectChat);
    });
    return () => window.clearTimeout(sendTimer);
  }, []);

  async function stopChatResponse() {
    try {
      const streamId = activeStreamIdRef.current;

      if (streamId) {
        const latestMessage = chatMessages.at(-1);
        const assistantMessage =
          latestMessage?.role === "assistant" ? latestMessage : undefined;
        const response = await fetch(`/api/chat/${chatId}/stop`, {
          body: JSON.stringify({
            activeStreamId: streamId,
            assistantMessage,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Chat stop request failed.");
        }
      }

      updateActiveResponseStreamId(null);
      await stop();
      router.refresh();
    } catch {
      const description = "Could not stop response.";
      setComposerAnnouncement(description);
      toast.add({ description, title: "Stop failed", type: "error" });
    }
  }

  function retryChatMessage(messageId?: string) {
    clearError();
    setComposerAnnouncement("");

    if (activeStreamIdRef.current) {
      const streamId = activeStreamIdRef.current;
      const finishEventCount = chatFinishEventCountRef.current;
      void resumeStream().then(() => {
        if (
          activeStreamId === null &&
          activeStreamIdRef.current === streamId &&
          chatFinishEventCountRef.current === finishEventCount
        ) {
          // A 204 resume has no onFinish callback: no server stream remains.
          updateActiveResponseStreamId(null);
        }
        router.refresh();
      });
      return;
    }

    const streamId = crypto.randomUUID();
    updateActiveResponseStreamId(streamId);
    void regenerate({ body: { streamId }, messageId }).catch(() => {
      updateActiveResponseStreamId(null);
      setComposerAnnouncement("Could not retry response.");
    });
  }

  function submitSuggestedMessage(suggestion: string) {
    setComposerAnnouncement("");
    void sendChatMessage({ attachments, text: suggestion });
  }

  const statusAnnouncement =
    composerAnnouncement ||
    (status === "submitted"
      ? "Message sent. Waiting for response."
      : status === "streaming"
        ? "Response streaming."
        : status === "error"
          ? "Could not generate response."
          : "");

  return (
    <section
      aria-busy={isGenerating}
      aria-label="Chat conversation"
      className={cn("flex min-h-0 flex-1 flex-col", className)}
    >
      <h1 className="sr-only">{conversationTitle}</h1>

      <div className="flex size-full min-w-0 flex-col">
        <ChatMessageList
          className="-mb-8"
          feedbackChatId={initialMessages ? chatId : undefined}
          isGenerating={isGenerating}
          messages={messages}
          onRetryMessage={retryChatMessage}
          onSuggestionSelect={submitSuggestedMessage}
          status={status}
          streamingMessageId={streamingMessageId}
        />

        {error && (
          <div className="mx-auto mb-2 w-full max-w-3xl px-4">
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>Could not generate response</AlertTitle>
              <AlertDescription>
                Something interrupted the response. Try again.
              </AlertDescription>
              <AlertAction>
                <Button
                  className="h-11 sm:h-7"
                  onClick={() => retryChatMessage()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Try again
                </Button>
              </AlertAction>
            </Alert>
          </div>
        )}

        <ChatComposer
          attachments={attachments}
          className="mx-auto"
          draft={draft}
          isGenerating={isGenerating}
          onAnnouncementChange={setComposerAnnouncement}
          onAttachmentsChange={setAttachments}
          onDraftChange={setDraft}
          onSendMessage={sendChatMessage}
          onStopResponse={() => void stopChatResponse()}
        />

        <ChatFooterNotice>
          AI can make mistakes. Verify important information.
        </ChatFooterNotice>
      </div>

      <p className="sr-only" role="status">
        {statusAnnouncement}
      </p>
    </section>
  );
}
