import { ChatComposerLoading } from "@/features/chat/components/chat-composer"
import { ChatPageHeader } from "@/features/chat/components/chat-page-header"
import { ChatPageShell } from "@/features/chat/components/chat-page-shell"
import { getChatPageView } from "@/features/chat/chat-queries"
import { getAuthenticatedWorkspaceContext } from "@/features/workspace/workspace-queries"
import { Skeleton } from "@/components/ui/skeleton"

/** Loads authenticated blank chat composer. */
export async function NewChatPageContent() {
  await getAuthenticatedWorkspaceContext()

  return (
    <ChatPageShell
      chat={{
        id: crypto.randomUUID(),
        isOwner: true,
        pinned: false,
        publicToken: null,
        title: "New chat",
        visibility: "private",
      }}
    />
  )
}

/** Loads workspace-scoped persisted chat by ID. */
export async function ChatByIdPageContent({ chatId }: { chatId: string }) {
  const workspace = await getAuthenticatedWorkspaceContext()
  const view = await getChatPageView(
    chatId,
    workspace.userId,
    workspace.activeWorkspaceId
  )

  return <ChatPageShell chat={view.chat} initialMessages={view.messages} />
}

/** Reserves chat header and top of transcript while chat data loads. */
export function ChatPageContentSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-1 flex-col">
      <ChatPageHeader>
        <Skeleton className="h-4 w-40" />
      </ChatPageHeader>
      <div
        aria-hidden="true"
        className="min-h-0 flex-1 overflow-hidden px-4 py-6"
        data-slot="chat-loading-transcript"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
          <div className="flex w-4/5 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="ml-auto h-12 w-2/5 rounded-xl" />
          <div className="flex w-4/5 flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
      <ChatComposerLoading className="mx-auto" />
      <p className="shrink-0 px-4 py-2.5 text-center text-xs text-balance text-muted-foreground">
        AI can make mistakes. Verify important information.
      </p>
      <p className="sr-only" role="status">
        Loading chat.
      </p>
    </div>
  )
}
