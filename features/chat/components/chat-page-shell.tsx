import {
  ChatConversationTitle,
  ChatConversationTitleProvider,
} from "@/features/chat/components/chat-conversation-title";
import { ChatPageHeader } from "@/features/chat/components/chat-page-header";
import { ChatShareDialog } from "@/features/chat/components/chat-share-dialog";
import { ChatThread } from "@/features/chat/components/chat-thread";
import { ChatThreadActions } from "@/features/chat/components/chat-thread-actions";
import { ChatTranscript } from "@/features/chat/components/chat-transcript";
import type { ChatUIMessage } from "@/src/interface-adapters/presenters/chat-message.presenter";
import type { ChatVisibility } from "@/src/entities/models/chat";

export type ChatPageShellChat = {
  id: string;
  isOwner: boolean;
  pinned: boolean;
  publicToken: string | null;
  title: string;
  visibility: ChatVisibility;
};

/** Renders current chat header and writable or read-only conversation. */
export function ChatPageShell({
  chat,
  initialMessages,
}: {
  chat: ChatPageShellChat;
  initialMessages?: ChatUIMessage[];
}) {
  return (
    <ChatConversationTitleProvider key={chat.id} initialTitle={chat.title}>
      <ChatPageHeader
        actions={
          chat.isOwner ? (
            <>
              <ChatShareDialog
                chatId={chat.id}
                initialPublicToken={chat.publicToken}
                initialVisibility={chat.visibility}
              />
              <ChatThreadActions chatId={chat.id} pinned={chat.pinned} />
            </>
          ) : undefined
        }
        data-testid="chat-content"
      >
        <ChatConversationTitle className="min-w-0" />
      </ChatPageHeader>
      {chat.isOwner ? (
        <ChatThread chatId={chat.id} initialMessages={initialMessages} />
      ) : (
        <ChatTranscript messages={initialMessages ?? []} title={chat.title} />
      )}
    </ChatConversationTitleProvider>
  );
}
