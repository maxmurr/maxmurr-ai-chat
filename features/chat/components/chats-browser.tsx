"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  EllipsisVerticalIcon,
  MessageSquareIcon,
  SearchIcon,
  SearchXIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { deleteChatsAction, pinChatAction } from "@/features/chat/chat-actions";
import type {
  ChatListBrowserEntry,
  ChatListCursorPayload,
  ChatListPagePayload,
} from "@/features/chat/chat-list-contract";
import { ChatActionsMenuContent } from "@/features/chat/components/chat-actions-menu-content";
import type { ChatConversationEntry } from "@/features/chat/components/chat-conversation-item";
import {
  ChatDeleteDialog,
  ChatRenameDialog,
} from "@/features/chat/components/chat-dialogs";
import { CHAT_ACTIVITY_UPDATED_EVENT } from "@/features/chat/components/chat-history";
import { ChatShareDialogContent } from "@/features/chat/components/chat-share-dialog";
import { formatChatSearchUpdatedDate } from "@/features/chat/components/chat-search";
import { cn } from "@/lib/utils";
import type { ChatListFilter } from "@/src/entities/models/chat";

const chatListFilterOptions = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Pinned", value: "pinned" },
] satisfies readonly { label: string; value: ChatListFilter }[];

type ChatListDialog = "delete" | "rename" | "share";
type ChatProjectOption = { id: string; name: string };

async function fetchChatListPage({
  cursor,
  filter,
  query,
  signal,
}: {
  cursor: ChatListCursorPayload | null;
  filter: ChatListFilter;
  query: string;
  signal?: AbortSignal;
}) {
  const searchParams = new URLSearchParams();

  if (query) searchParams.set("query", query);
  if (filter !== "all") searchParams.set("filter", filter);
  if (cursor) {
    searchParams.set("cursorId", cursor.id);
    searchParams.set("cursorUpdatedAt", cursor.updatedAt);
  }

  const response = await fetch(`/api/chats?${searchParams}`, { signal });

  if (!response.ok) {
    throw new Error("Chat list request failed.");
  }

  const page = (await response.json()) as ChatListPagePayload;

  if (!Array.isArray(page.chats)) {
    throw new Error("Chat list response was invalid.");
  }

  return page;
}

/** Appends one cursor page without duplicating Chats at page boundaries. */
export function mergeChatListPage(
  currentChats: ChatListBrowserEntry[],
  nextChats: ChatListBrowserEntry[]
) {
  const currentChatIds = new Set(currentChats.map(({ id }) => id));
  return [
    ...currentChats,
    ...nextChats.filter(({ id }) => !currentChatIds.has(id)),
  ];
}

function ChatListRowsSkeleton() {
  return (
    <div aria-label="Loading chats" role="status">
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
  );
}

function ChatListRow({
  chat,
  isSelected,
  onChange,
  onDialog,
  onSelect,
  onTogglePin,
  projects,
  selectionMode,
}: {
  chat: ChatListBrowserEntry;
  isSelected: boolean;
  onChange: (changes: Partial<ChatListBrowserEntry>) => void;
  onDialog: (dialog: ChatListDialog) => void;
  onSelect: () => void;
  onTogglePin: () => void;
  projects: ChatProjectOption[];
  selectionMode: boolean;
}) {
  const isGeneratingResponse = chat.activeStreamId !== null;
  const activityLabel = isGeneratingResponse
    ? ", generating response"
    : chat.hasUnreadResponse
      ? ", unread response"
      : "";
  const supportingText = chat.searchSnippet ?? chat.projectName;
  const chatDetails = (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-base font-medium sm:text-sm">
          {chat.title}
        </p>
        {(isGeneratingResponse || chat.hasUnreadResponse) && (
          <span
            aria-hidden="true"
            className="flex size-4 shrink-0 items-center justify-center"
          >
            {isGeneratingResponse ? (
              <Spinner className="text-muted-foreground motion-reduce:animate-none" />
            ) : (
              <span className="size-2 rounded-full bg-status-unread" />
            )}
          </span>
        )}
      </div>
      {supportingText && (
        <p className="truncate text-base text-muted-foreground sm:text-sm">
          {supportingText}
        </p>
      )}
    </>
  );

  return (
    <li className="group/chat-list-row relative -mx-3 flex min-h-12 items-center gap-2 rounded-lg px-3 focus-within:bg-muted has-data-popup-open:bg-muted has-data-popup-open:[&>time]:opacity-0 pointer-fine:hover:bg-muted after:pointer-events-none after:absolute after:right-3 after:bottom-0 after:left-3 after:h-px after:bg-border last:after:hidden [contain-intrinsic-size:auto_3rem] [content-visibility:auto]">
      {selectionMode && (
        <label
          className="flex size-11 shrink-0 items-center justify-center sm:size-9"
          htmlFor={`select-chat-${chat.id}`}
        >
          <Checkbox
            aria-label={`Select ${chat.title}`}
            checked={isSelected}
            disabled={isGeneratingResponse}
            id={`select-chat-${chat.id}`}
            name="selected-chat"
            onCheckedChange={onSelect}
            value={chat.id}
          />
        </label>
      )}

      {selectionMode ? (
        <button
          aria-label={`${isSelected ? "Deselect" : "Select"} ${chat.title}${activityLabel}`}
          className="min-w-0 flex-1 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          disabled={isGeneratingResponse}
          onClick={onSelect}
          type="button"
        >
          {chatDetails}
        </button>
      ) : (
        <Link
          aria-label={`${chat.title}${activityLabel}`}
          className="min-w-0 flex-1 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          href={`/chat/${chat.id}`}
        >
          {chatDetails}
        </Link>
      )}

      <time
        className={cn(
          "pointer-events-none shrink-0 text-base text-muted-foreground tabular-nums sm:text-sm",
          !selectionMode &&
            "pointer-fine:group-focus-within/chat-list-row:opacity-0 pointer-fine:group-hover/chat-list-row:opacity-0"
        )}
        dateTime={chat.updatedAt}
      >
        {formatChatSearchUpdatedDate(new Date(chat.updatedAt))}
      </time>

      {!selectionMode && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={`Open chat actions for ${chat.title}`}
                className="pointer-coarse:size-11 pointer-fine:absolute pointer-fine:inset-y-0 pointer-fine:right-3 pointer-fine:my-auto pointer-fine:pointer-events-none pointer-fine:opacity-0 pointer-fine:group-focus-within/chat-list-row:pointer-events-auto pointer-fine:group-focus-within/chat-list-row:opacity-100 pointer-fine:group-hover/chat-list-row:pointer-events-auto pointer-fine:group-hover/chat-list-row:opacity-100 data-popup-open:pointer-events-auto data-popup-open:opacity-100 motion-reduce:transition-none"
                size="icon"
                type="button"
                variant="ghost"
              />
            }
          >
            <EllipsisVerticalIcon />
          </DropdownMenuTrigger>
          <ChatActionsMenuContent
            align="end"
            chatId={chat.id}
            onDelete={() => onDialog("delete")}
            onProjectChange={(projectId) =>
              onChange({
                projectId,
                projectName:
                  projects.find((project) => project.id === projectId)?.name ??
                  null,
              })
            }
            onRename={() => onDialog("rename")}
            onSelect={isGeneratingResponse ? undefined : onSelect}
            onShare={() => onDialog("share")}
            onTogglePin={onTogglePin}
            pinned={chat.pinned}
            projectId={chat.projectId}
            projects={projects}
          />
        </DropdownMenu>
      )}
    </li>
  );
}

/** Renders searchable, infinitely paginated owner Chats with bulk selection. */
export function ChatsBrowser({
  initialPage,
  projects,
}: {
  initialPage: ChatListPagePayload;
  projects: ChatProjectOption[];
}) {
  const [activeChat, setActiveChat] = useState<ChatListBrowserEntry | null>(
    null
  );
  const [activeDialog, setActiveDialog] = useState<ChatListDialog | null>(null);
  const [chats, setChats] = useState(initialPage.chats);
  const [filter, setFilter] = useState<ChatListFilter>("all");
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [query, setQuery] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(
    () => new Set()
  );
  const [selectionMode, setSelectionMode] = useState(false);
  const loadMoreInFlightRef = useRef(false);
  const requestKeyRef = useRef("all\n");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const skipInitialRequestRef = useRef(true);
  const selectableChats = chats.filter(
    ({ activeStreamId }) => activeStreamId === null
  );
  const allLoadedChatsSelected =
    selectableChats.length > 0 &&
    selectableChats.every(({ id }) => selectedChatIds.has(id));
  const filterLabel =
    chatListFilterOptions.find((option) => option.value === filter)?.label ??
    "All";

  function changeChat(chatId: string, changes: Partial<ChatListBrowserEntry>) {
    setChats((currentChats) =>
      currentChats.map((chat) =>
        chat.id === chatId ? { ...chat, ...changes } : chat
      )
    );
    setActiveChat((currentChat) =>
      currentChat?.id === chatId ? { ...currentChat, ...changes } : currentChat
    );
  }

  function openChatDialog(chat: ChatListBrowserEntry, dialog: ChatListDialog) {
    setActiveChat(chat);
    setActiveDialog(dialog);
  }

  function toggleChatSelection(chatId: string) {
    setSelectionMode(true);
    setSelectedChatIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(chatId)) nextIds.delete(chatId);
      else nextIds.add(chatId);
      return nextIds;
    });
  }

  function toggleAllLoadedChats() {
    setSelectedChatIds(
      allLoadedChatsSelected
        ? new Set()
        : new Set(selectableChats.map(({ id }) => id))
    );
  }

  async function toggleChatPin(chat: ChatListBrowserEntry) {
    const result = await pinChatAction(chat.id, !chat.pinned);

    if (!result.ok) {
      toast.add({
        description: result.error,
        title: "Pin failed",
        type: "error",
      });
      return;
    }

    if (filter === "pinned" && chat.pinned) {
      setChats((currentChats) =>
        currentChats.filter(({ id }) => id !== chat.id)
      );
      return;
    }

    changeChat(chat.id, { pinned: !chat.pinned });
  }

  async function deleteSelectedChats() {
    const chatIds = [...selectedChatIds];
    setIsBulkDeleting(true);
    const result = await deleteChatsAction(chatIds);
    setIsBulkDeleting(false);

    if (!result.ok) {
      toast.add({
        description: result.error,
        title: "Delete failed",
        type: "error",
      });
      return;
    }

    const deletedChatIdSet = new Set(result.deletedChatIds);
    setChats((currentChats) =>
      currentChats.filter(({ id }) => !deletedChatIdSet.has(id))
    );
    setSelectedChatIds(new Set(result.blockedChatIds));
    setIsBulkDeleteOpen(false);
    setSelectionMode(result.blockedChatIds.length > 0);

    if (result.blockedChatIds.length > 0) {
      toast.add({
        description: "Stop active responses, then try those chats again.",
        title: "Some chats were not deleted",
        type: "error",
      });
    }
  }

  useEffect(() => {
    const requestKey = `${filter}\n${query.trim()}`;
    requestKeyRef.current = requestKey;

    if (skipInitialRequestRef.current) {
      skipInitialRequestRef.current = false;
      return;
    }

    const abortController = new AbortController();
    setSelectedChatIds(new Set());
    setIsReplacing(true);
    setLoadError(null);
    setLoadMoreError(null);
    setNextCursor(null);
    const timer = window.setTimeout(
      () => {
        setChats([]);
        void fetchChatListPage({
          cursor: null,
          filter,
          query: query.trim(),
          signal: abortController.signal,
        })
          .then((page) => {
            if (requestKey !== requestKeyRef.current) return;
            setChats(page.chats);
            setNextCursor(page.nextCursor);
          })
          .catch(() => {
            if (!abortController.signal.aborted) {
              setLoadError("Chats could not be loaded.");
            }
          })
          .finally(() => {
            if (!abortController.signal.aborted) setIsReplacing(false);
          });
      },
      query.trim() ? 250 : 0
    );

    return () => {
      abortController.abort();
      window.clearTimeout(timer);
    };
  }, [filter, query, reloadVersion]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (
      !sentinel ||
      !nextCursor ||
      isReplacing ||
      isLoadingMore ||
      loadError ||
      loadMoreError
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || loadMoreInFlightRef.current) return;

        loadMoreInFlightRef.current = true;
        setIsLoadingMore(true);
        const requestKey = requestKeyRef.current;
        void fetchChatListPage({
          cursor: nextCursor,
          filter,
          query: query.trim(),
        })
          .then((page) => {
            if (requestKey !== requestKeyRef.current) return;
            setChats((currentChats) =>
              mergeChatListPage(currentChats, page.chats)
            );
            setNextCursor(page.nextCursor);
          })
          .catch(() => {
            if (requestKey === requestKeyRef.current) {
              setLoadMoreError("More chats could not be loaded.");
            }
          })
          .finally(() => {
            loadMoreInFlightRef.current = false;
            setIsLoadingMore(false);
          });
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    filter,
    isLoadingMore,
    isReplacing,
    loadError,
    loadMoreError,
    nextCursor,
    query,
  ]);

  useEffect(() => {
    function updateChatActivity(event: Event) {
      const activityChats = (event as CustomEvent<ChatConversationEntry[]>)
        .detail;

      if (!Array.isArray(activityChats)) return;

      const activityByChatId = new Map(
        activityChats.map((chat) => [chat.id, chat])
      );
      setChats((currentChats) =>
        currentChats.flatMap((chat) => {
          const activity = activityByChatId.get(chat.id);

          if (!activity) return [chat];

          const updatedChat = {
            ...chat,
            activeStreamId: activity.activeStreamId,
            hasUnreadResponse: activity.hasUnreadResponse,
            pinned: activity.pinned,
            projectId: activity.projectId,
            projectName: activity.projectName,
            publicToken: activity.publicToken,
            title: activity.title,
            updatedAt: activity.updatedAt.toISOString(),
            visibility: activity.visibility,
          };

          return (filter === "pinned" && !updatedChat.pinned) ||
            (filter === "unread" && !updatedChat.hasUnreadResponse)
            ? []
            : [updatedChat];
        })
      );
    }

    window.addEventListener(CHAT_ACTIVITY_UPDATED_EVENT, updateChatActivity);
    return () =>
      window.removeEventListener(
        CHAT_ACTIVITY_UPDATED_EVENT,
        updateChatActivity
      );
  }, [filter]);

  return (
    <section aria-label="Chats" className="flex flex-col gap-4" id="chat-list">
      {selectionMode ? (
        <div className="flex min-h-11 flex-wrap items-center justify-end gap-2 sm:min-h-8">
          <p className="mr-auto text-base text-muted-foreground tabular-nums sm:text-sm">
            {selectedChatIds.size} selected
          </p>
          <Button
            onClick={toggleAllLoadedChats}
            size="touch"
            type="button"
            variant="secondary"
          >
            {allLoadedChatsSelected ? "Deselect all" : "Select all"}
          </Button>
          <Button
            disabled={selectedChatIds.size === 0}
            onClick={() => setIsBulkDeleteOpen(true)}
            size="touch"
            type="button"
            variant="destructive"
          >
            Delete
          </Button>
          <Button
            aria-label="Exit selection"
            onClick={() => {
              setSelectedChatIds(new Set());
              setSelectionMode(false);
            }}
            size="icon"
            type="button"
            variant="secondary"
          >
            <XIcon />
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <InputGroup className="h-11 basis-full sm:h-8 sm:max-w-xs sm:basis-auto sm:flex-1">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Search chat contents"
              autoComplete="off"
              name="chat-list-search"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search chats…"
              spellCheck={false}
              type="search"
              value={query}
            />
          </InputGroup>

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button size="touch" type="button" variant="secondary" />
                }
              >
                {filterLabel}
                <ChevronDownIcon data-icon="inline-end" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuGroup>
                  <DropdownMenuRadioGroup
                    onValueChange={(value) =>
                      setFilter(value as ChatListFilter)
                    }
                    value={filter}
                  >
                    {chatListFilterOptions.map((option) => (
                      <DropdownMenuRadioItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={() => setSelectionMode(true)}
              size="touch"
              type="button"
              variant="secondary"
            >
              Select
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/chat" />}
              size="touch"
            >
              New chat
            </Button>
          </div>
        </div>
      )}

      {isReplacing ? (
        <ChatListRowsSkeleton />
      ) : loadError ? (
        <Empty className="min-h-64">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>Chats unavailable</EmptyTitle>
            <EmptyDescription>{loadError}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={() => setReloadVersion((version) => version + 1)}
              type="button"
              variant="secondary"
            >
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      ) : chats.length === 0 ? (
        <Empty className="min-h-64">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {query.trim() || filter !== "all" ? (
                <SearchXIcon />
              ) : (
                <MessageSquareIcon />
              )}
            </EmptyMedia>
            <EmptyTitle>
              {query.trim() || filter !== "all"
                ? "No chats found"
                : "No chats yet"}
            </EmptyTitle>
            <EmptyDescription>
              {query.trim()
                ? `No chat title or message matches “${query.trim()}”.`
                : filter === "unread"
                  ? "No chats have unread responses."
                  : filter === "pinned"
                    ? "No chats are pinned."
                    : "Start a chat to see it here."}
            </EmptyDescription>
          </EmptyHeader>
          {!query.trim() && filter === "all" && (
            <EmptyContent>
              <Button
                nativeButton={false}
                render={<Link href="/chat" />}
                size="touch"
              >
                New chat
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <ul role="list">
          {chats.map((chat) => (
            <ChatListRow
              chat={chat}
              isSelected={selectedChatIds.has(chat.id)}
              key={chat.id}
              onChange={(changes) => changeChat(chat.id, changes)}
              onDialog={(dialog) => openChatDialog(chat, dialog)}
              onSelect={() => toggleChatSelection(chat.id)}
              onTogglePin={() => void toggleChatPin(chat)}
              projects={projects}
              selectionMode={selectionMode}
            />
          ))}
        </ul>
      )}

      <div
        aria-live="polite"
        className="flex min-h-12 items-center justify-center"
        ref={sentinelRef}
      >
        {isLoadingMore && (
          <>
            <Spinner className="text-muted-foreground motion-reduce:animate-none" />
            <span className="sr-only">Loading more chats</span>
          </>
        )}
        {loadMoreError && (
          <Button
            onClick={() => setLoadMoreError(null)}
            type="button"
            variant="secondary"
          >
            Try loading more
          </Button>
        )}
      </div>

      {activeChat && (
        <>
          <ChatRenameDialog
            chat={activeChat}
            key={`rename-${activeChat.id}`}
            onOpenChange={(open) => {
              if (!open) setActiveDialog(null);
            }}
            onRenamed={(title) => changeChat(activeChat.id, { title })}
            open={activeDialog === "rename"}
          />
          <ChatDeleteDialog
            chat={activeChat}
            key={`delete-${activeChat.id}`}
            onDeleted={() => {
              setChats((currentChats) =>
                currentChats.filter(({ id }) => id !== activeChat.id)
              );
              setSelectedChatIds((currentIds) => {
                const nextIds = new Set(currentIds);
                nextIds.delete(activeChat.id);
                return nextIds;
              });
            }}
            onOpenChange={(open) => {
              if (!open) setActiveDialog(null);
            }}
            open={activeDialog === "delete"}
          />
          <Dialog
            key={`share-${activeChat.id}`}
            onOpenChange={(open) => {
              if (!open) setActiveDialog(null);
            }}
            open={activeDialog === "share"}
          >
            <ChatShareDialogContent
              chatId={activeChat.id}
              initialPublicToken={activeChat.publicToken}
              initialVisibility={activeChat.visibility}
            />
          </Dialog>
        </>
      )}

      <AlertDialog
        onOpenChange={(open) => {
          if (!isBulkDeleting) setIsBulkDeleteOpen(open);
        }}
        open={isBulkDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedChatIds.size}{" "}
              {selectedChatIds.size === 1 ? "chat" : "chats"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes selected chats and their messages. Shared
              links stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isBulkDeleting}
              onClick={() => void deleteSelectedChats()}
              variant="destructive"
            >
              {isBulkDeleting && <Spinner data-icon="inline-start" />}
              {isBulkDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
