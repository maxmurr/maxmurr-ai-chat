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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-11 basis-full motion-reduce:animate-none sm:h-8 sm:max-w-xs sm:basis-auto sm:flex-1" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-11 w-15 motion-reduce:animate-none sm:h-8" />
            <Skeleton className="h-11 w-16 motion-reduce:animate-none sm:h-8" />
            <Skeleton className="h-11 w-21 motion-reduce:animate-none sm:h-8" />
          </div>
        </div>
        <div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              className="relative -mx-3 flex min-h-12 items-center gap-2 px-3 after:pointer-events-none after:absolute after:right-3 after:bottom-0 after:left-3 after:h-px after:bg-border last:after:hidden"
              key={index}
            >
              <Skeleton className="h-5 w-2/3 max-w-sm min-w-0 motion-reduce:animate-none sm:h-4" />
              <Skeleton className="ml-auto h-5 w-14 shrink-0 motion-reduce:animate-none sm:h-4" />
              <Skeleton className="size-11 shrink-0 pointer-fine:hidden motion-reduce:animate-none" />
            </div>
          ))}
        </div>
        <div className="min-h-12" />
      </div>
    </AppPageContainer>
  );
}
