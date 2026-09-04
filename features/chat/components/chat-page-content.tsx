import { AppPageHeader } from "@/components/app-page-header";
import { AppRouteShell } from "@/components/app-route-shell";
import { ChatComposerLoading } from "@/features/chat/components/chat-composer";
import { ChatFooterNotice } from "@/features/chat/components/chat-footer-notice";
import { ChatPageShell } from "@/features/chat/components/chat-page-shell";
import { getChatPageView } from "@/features/chat/chat-queries";
import { getAuthenticatedWorkspaceContext } from "@/features/workspace/workspace-queries";
import { Skeleton } from "@/components/ui/skeleton";

/** Loads authenticated blank chat composer. */
export async function NewChatPageContent() {
  const workspace = await getAuthenticatedWorkspaceContext();

  return (
    <ChatPageShell
      chat={{
        activeStreamId: null,
        id: crypto.randomUUID(),
        isOwner: true,
        pinned: false,
        projectId: null,
        publicToken: null,
        title: "New chat",
        visibility: "private",
      }}
      currentUser={{
        ...(workspace.currentUser.avatar
          ? { avatarUrl: workspace.currentUser.avatar }
          : {}),
        displayName: workspace.currentUser.name,
        userId: workspace.userId,
      }}
      isChatPersisted={false}
    />
  );
}

/** Loads workspace-scoped persisted chat by ID. */
export async function ChatByIdPageContent({ chatId }: { chatId: string }) {
  const workspace = await getAuthenticatedWorkspaceContext();
  const view = await getChatPageView(
    chatId,
    workspace.userId,
    workspace.activeWorkspaceId
  );

  return (
    <ChatPageShell
      chat={view.chat}
      currentUser={{
        ...(workspace.currentUser.avatar
          ? { avatarUrl: workspace.currentUser.avatar }
          : {}),
        displayName: workspace.currentUser.name,
        userId: workspace.userId,
      }}
      initialMessages={view.messages}
      isChatPersisted
    />
  );
}

/** Reserves chat header and top of transcript while chat data loads. */
export function ChatPageContentSkeleton() {
  return (
    <AppRouteShell
      aria-busy="true"
      aria-label="Loading chat"
      className="min-w-0"
    >
      <AppPageHeader>
        <Skeleton className="h-5 w-2/3 max-w-40 sm:h-4" />
      </AppPageHeader>
      <div
        aria-hidden="true"
        className="min-h-0 flex-1 overflow-hidden px-4 py-6"
        data-slot="chat-loading-transcript"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 sm:gap-8">
          <div className="flex w-4/5 min-w-0 flex-col gap-2">
            <Skeleton className="h-5 w-3/4 sm:h-4" />
            <Skeleton className="h-5 w-full sm:h-4" />
            <Skeleton className="h-5 w-2/3 sm:h-4" />
          </div>
          <div className="flex items-end justify-end gap-2">
            <Skeleton className="h-12 w-3/5 max-w-sm rounded-xl rounded-br-[4px] sm:w-2/5" />
            <Skeleton className="size-8 shrink-0 rounded-full" />
          </div>
          <div className="flex w-4/5 min-w-0 flex-col gap-2">
            <Skeleton className="h-5 w-full sm:h-4" />
            <Skeleton className="h-5 w-5/6 sm:h-4" />
          </div>
        </div>
      </div>
      <ChatComposerLoading className="mx-auto" />
      <ChatFooterNotice>
        AI can make mistakes. Verify important information.
      </ChatFooterNotice>
      <p className="sr-only" role="status">
        Loading chat.
      </p>
    </AppRouteShell>
  );
}
