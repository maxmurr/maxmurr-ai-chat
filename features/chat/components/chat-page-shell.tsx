import {
  ChatConversationTitle,
  ChatConversationTitleProvider,
} from "@/features/chat/components/chat-conversation-title";
import { AppPageHeader } from "@/components/app-page-header";
import { ChatShareDialog } from "@/features/chat/components/chat-share-dialog";
import { ChatThread } from "@/features/chat/components/chat-thread";
import { ChatThreadActions } from "@/features/chat/components/chat-thread-actions";
import { ChatTranscript } from "@/features/chat/components/chat-transcript";
import { getProjectsPageData } from "@/features/project/project-queries";
import type { ChatUIMessage } from "@/src/interface-adapters/presenters/chat-message.presenter";
import type {
  ChatMessageSender,
  ChatVisibility,
} from "@/src/entities/models/chat";

export type ChatPageShellChat = {
  activeStreamId: string | null;
  id: string;
  isOwner: boolean;
  pinned: boolean;
  projectId: string | null;
  publicToken: string | null;
  title: string;
  visibility: ChatVisibility;
};

/** Renders current chat header and writable or read-only conversation. */
export async function ChatPageShell({
  chat,
  currentUser,
  initialMessages,
  isChatPersisted,
}: {
  chat: ChatPageShellChat;
  currentUser: ChatMessageSender;
  initialMessages?: ChatUIMessage[];
  isChatPersisted: boolean;
}) {
  const canManageChat = chat.isOwner && isChatPersisted;
  const projects = canManageChat
    ? (await getProjectsPageData()).map(({ id, name }) => ({ id, name }))
    : [];

  return (
    <ChatConversationTitleProvider key={chat.id} initialTitle={chat.title}>
      <AppPageHeader
        actions={
          canManageChat ? (
            <>
              <ChatShareDialog
                chatId={chat.id}
                initialPublicToken={chat.publicToken}
                initialVisibility={chat.visibility}
              />
              <ChatThreadActions
                chatId={chat.id}
                pinned={chat.pinned}
                projectId={chat.projectId}
                projects={projects}
              />
            </>
          ) : undefined
        }
        data-testid="chat-content"
      >
        <ChatConversationTitle className="min-w-0" />
      </AppPageHeader>
      {chat.isOwner ? (
        <ChatThread
          activeStreamId={chat.activeStreamId}
          chatId={chat.id}
          currentUser={currentUser}
          initialMessages={initialMessages}
        />
      ) : (
        <ChatTranscript messages={initialMessages ?? []} title={chat.title} />
      )}
    </ChatConversationTitleProvider>
  );
}
