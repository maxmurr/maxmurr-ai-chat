import { AppPageContainer } from "@/components/app-page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { getChatsPageData } from "@/features/chat/chat-queries";
import { serializeChatListPage } from "@/features/chat/chat-list-contract";
import { ChatsBrowser } from "@/features/chat/components/chats-browser";
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
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-11 basis-full motion-reduce:animate-none sm:h-8 sm:max-w-xs sm:basis-auto sm:flex-1" />
          <Skeleton className="h-11 w-20 motion-reduce:animate-none sm:h-8" />
          <Skeleton className="h-11 w-16 motion-reduce:animate-none sm:h-8" />
          <Skeleton className="h-11 w-20 motion-reduce:animate-none sm:h-8" />
        </div>
        <div>
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              className="flex min-h-12 items-center gap-3 border-b py-3"
              key={index}
            >
              <Skeleton className="h-5 min-w-0 flex-1 motion-reduce:animate-none sm:h-4" />
              <Skeleton className="h-5 w-14 shrink-0 motion-reduce:animate-none sm:h-4" />
              <Skeleton className="size-11 shrink-0 pointer-fine:hidden motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    </AppPageContainer>
  );
}
