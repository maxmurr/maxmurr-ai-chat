import { ChatTranscript } from "@/features/chat/components/chat-transcript"
import { getPublicChatView } from "@/features/chat/chat-queries"
import { Skeleton } from "@/components/ui/skeleton"

/** Loads public-link chat and renders read-only transcript. */
export async function SharedChatContent({ publicToken }: { publicToken: string }) {
  const view = await getPublicChatView(publicToken)

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <p className="min-w-0 flex-1 truncate text-base sm:text-sm">
          {view.title}
        </p>
        <p className="shrink-0 text-xs text-muted-foreground">Shared chat</p>
      </header>
      <ChatTranscript messages={view.messages} title={view.title} />
    </>
  )
}

/** Reserves public chat header and transcript while data loads. */
export function SharedChatContentSkeleton() {
  return (
    <>
      <header className="flex h-14 shrink-0 items-center border-b px-4">
        <Skeleton className="h-4 w-48" />
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-20 w-4/5" />
        <Skeleton className="ml-auto h-12 w-3/5" />
        <Skeleton className="h-24 w-4/5" />
      </div>
    </>
  )
}
