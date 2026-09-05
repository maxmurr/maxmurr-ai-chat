"use client";

import { useEffect, useOptimistic } from "react";

type OptimisticChatListEntry = {
  id: string;
  pinned?: boolean;
  projectId?: string | null;
  projectName?: string | null;
  title?: string;
};

type OptimisticChatChanges = Partial<
  Pick<
    OptimisticChatListEntry,
    "pinned" | "projectId" | "projectName" | "title"
  >
>;

/** One temporary Chat list change held until its server Action settles. */
export type OptimisticChatListAction =
  | { chatId: string; changes: OptimisticChatChanges; type: "update" }
  | { chatIds: string[]; type: "delete" };

/** Browser event used to apply one Chat mutation across sibling list views. */
export const OPTIMISTIC_CHAT_LIST_EVENT = "chat-list-optimistic-update";

/** Applies one optimistic update or deletion to Chat list entries. */
export function reduceOptimisticChatList<T extends OptimisticChatListEntry>(
  chats: T[],
  action: OptimisticChatListAction
): T[] {
  if (action.type === "delete") {
    const deletedChatIds = new Set(action.chatIds);
    return chats.filter(({ id }) => !deletedChatIds.has(id));
  }

  return chats.map((chat) =>
    chat.id === action.chatId ? { ...chat, ...action.changes } : chat
  );
}

/** Dispatches a Chat list update from inside a React Action. */
export function dispatchOptimisticChatListAction(
  action: OptimisticChatListAction
) {
  window.dispatchEvent(
    new CustomEvent<OptimisticChatListAction>(OPTIMISTIC_CHAT_LIST_EVENT, {
      detail: action,
    })
  );
}

function useOptimisticChatListEvents(
  dispatchOptimisticAction: (action: OptimisticChatListAction) => void
) {
  useEffect(() => {
    function updateOptimisticChatList(event: Event) {
      dispatchOptimisticAction(
        (event as CustomEvent<OptimisticChatListAction>).detail
      );
    }

    window.addEventListener(
      OPTIMISTIC_CHAT_LIST_EVENT,
      updateOptimisticChatList
    );
    return () =>
      window.removeEventListener(
        OPTIMISTIC_CHAT_LIST_EVENT,
        updateOptimisticChatList
      );
  }, [dispatchOptimisticAction]);
}

/** Layers cross-component optimistic Chat actions over current list data. */
export function useOptimisticChatList<T extends OptimisticChatListEntry>(
  chats: T[]
) {
  const [optimisticChats, dispatchOptimisticAction] = useOptimistic(
    chats,
    reduceOptimisticChatList<T>
  );
  useOptimisticChatListEvents(dispatchOptimisticAction);
  return optimisticChats;
}

/** Layers cross-component optimistic Chat actions over one active Chat. */
export function useOptimisticChatEntry<T extends OptimisticChatListEntry>(
  chat: T
) {
  const [optimisticChats, dispatchOptimisticAction] = useOptimistic(
    [chat],
    reduceOptimisticChatList<T>
  );
  useOptimisticChatListEvents(dispatchOptimisticAction);
  return optimisticChats[0] ?? chat;
}
