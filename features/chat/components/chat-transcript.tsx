import type { ReactNode } from "react";

import { ChatConversationLayout } from "@/features/chat/components/chat-conversation-layout";
import { ChatFooterNotice } from "@/features/chat/components/chat-footer-notice";
import { ChatMessageList } from "@/features/chat/components/chat-message-list";
import {
  convertChatUiMessageToDisplayMessage,
  type ChatUIMessage,
} from "@/src/interface-adapters/presenters/chat-message.presenter";

/** Renders a finished conversation for viewers who cannot write to it. */
export function ChatTranscript({
  className,
  footer = <ChatFooterNotice>This chat is read-only.</ChatFooterNotice>,
  messages,
  title,
}: {
  className?: string;
  footer?: ReactNode;
  messages: ChatUIMessage[];
  title: string;
}) {
  const displayMessages = messages.flatMap((message) => {
    const displayMessage = convertChatUiMessageToDisplayMessage(message);
    return displayMessage ? [displayMessage] : [];
  });

  return (
    <ChatConversationLayout className={className} title={title}>
      <ChatMessageList
        isGenerating={false}
        messages={displayMessages}
        status="ready"
      />

      {footer}
    </ChatConversationLayout>
  );
}
