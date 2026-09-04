import {
  isChatModelId,
  type ChatModelId,
} from "@/src/entities/models/chat-model";

/** First Project Chat turn carried through browser navigation. */
export type PendingProjectChat = {
  readonly modelId: ChatModelId;
  readonly projectId: string;
  readonly text: string;
  readonly webSearchEnabled: boolean;
};

const PENDING_PROJECT_CHAT_STORAGE_KEY = "pending-project-chat";

/** Stores first Project Chat turn until normal Chat page mounts. */
export function storePendingProjectChat(
  storage: Pick<Storage, "setItem">,
  pendingChat: PendingProjectChat
) {
  storage.setItem(
    PENDING_PROJECT_CHAT_STORAGE_KEY,
    JSON.stringify(pendingChat)
  );
}

/** Takes pending first Project Chat turn once, removing malformed values too. */
export function takePendingProjectChat(
  storage: Pick<Storage, "getItem" | "removeItem">
): PendingProjectChat | null {
  const value = storage.getItem(PENDING_PROJECT_CHAT_STORAGE_KEY);
  storage.removeItem(PENDING_PROJECT_CHAT_STORAGE_KEY);

  if (!value) return null;

  try {
    const pendingChat: unknown = JSON.parse(value);
    if (
      typeof pendingChat === "object" &&
      pendingChat !== null &&
      "modelId" in pendingChat &&
      isChatModelId(pendingChat.modelId) &&
      "projectId" in pendingChat &&
      typeof pendingChat.projectId === "string" &&
      "text" in pendingChat &&
      typeof pendingChat.text === "string" &&
      pendingChat.text.trim() &&
      "webSearchEnabled" in pendingChat &&
      typeof pendingChat.webSearchEnabled === "boolean"
    ) {
      return {
        modelId: pendingChat.modelId,
        projectId: pendingChat.projectId,
        text: pendingChat.text.trim(),
        webSearchEnabled: pendingChat.webSearchEnabled,
      };
    }
  } catch {
    // Malformed browser state is discarded above.
  }

  return null;
}
