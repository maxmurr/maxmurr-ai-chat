import { AppPageContainer } from "@/components/app-page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { getChatsPageData } from "@/features/chat/chat-queries";
import { serializeChatListPage } from "@/features/chat/chat-list-contract";
import { ChatsBrowser } from "@/features/chat/components/chats-browser";
import { ChatListRowsSkeleton } from "@/features/chat/components/chat-list-rows-skeleton";
import { getProjectsPageData } from "@/features/project/project-queries";

/** Loads first owner Chat page and available Project actions. */
export async function ChatsList() {
  const [page, projects] = await Promise.all([
    getChatsPageData(),
    getProjectsPageData(),
  ]);

  return (
    <AppPageContainer className="mx-auto">
      <ChatsBrowser
        initialPage={serializeChatListPage(page)}
        projects={projects.map(({ id, name }) => ({ id, name }))}
      />
    </AppPageContainer>
  );
}

/** Reserves Chat controls and rows while first page loads. */
export function ChatsListSkeleton() {
  return (
    <AppPageContainer
      aria-busy="true"
      aria-label="Loading chats"
      className="mx-auto"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-11 basis-full motion-reduce:animate-none sm:h-8 sm:max-w-xs sm:flex-1 sm:basis-auto" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-11 w-15 motion-reduce:animate-none sm:h-8" />
            <Skeleton className="h-11 w-16 motion-reduce:animate-none sm:h-8" />
            <Skeleton className="h-11 w-21 motion-reduce:animate-none sm:h-8" />
          </div>
        </div>
        <ChatListRowsSkeleton />
        <div className="min-h-12" />
      </div>
    </AppPageContainer>
  );
}
