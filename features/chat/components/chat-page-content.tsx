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

/** Reserves chat header, transcript, and composer while chat data loads. */
export function ChatPageContentSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatPageHeader>
        <Skeleton className="h-4 w-40" />
      </ChatPageHeader>
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-4 px-4 pb-4">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          <Skeleton className="h-16 w-4/5" />
          <Skeleton className="ml-auto h-12 w-3/5" />
          <Skeleton className="h-24 w-4/5" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  )
}
