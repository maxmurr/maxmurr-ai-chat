import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";

import { resolveApplicationDependency } from "@/di/application-container";
import { applicationInjectionTokens } from "@/di/application-container.registry";
import { getAuthenticatedWorkspaceContext } from "@/features/workspace/workspace-queries";
import type { ChatUIMessage } from "@/src/interface-adapters/presenters/chat-message.presenter";

function chatLibraryController() {
  return resolveApplicationDependency(
    applicationInjectionTokens.chatLibraryController
  );
}

/** Lists owner and workspace chats once per server render request. */
export const getChatSidebarEntries = cache(
  async (workspaceId: string, userId: string) => {
    const { ownChats, teamChats } =
      await chatLibraryController().listSidebarChats(workspaceId, userId);

    return {
      ownChats: ownChats.map(
        ({
          activeStreamId,
          hasUnreadResponse,
          id,
          pinned,
          projectId,
          projectName,
          publicToken,
          title,
          updatedAt,
          visibility,
        }) => ({
          activeStreamId,
          hasUnreadResponse,
          id,
          pinned,
          projectId,
          projectName,
          publicToken,
          title,
          updatedAt,
          visibility,
        })
      ),
      teamChats: teamChats.map(({ id, title, updatedAt }) => ({
        id,
        title,
        updatedAt,
      })),
    };
  }
);

/** Lists first owner Chat page for authenticated Chats index. */
export async function getChatsPageData() {
  const { activeWorkspaceId, userId } =
    await getAuthenticatedWorkspaceContext();

  return chatLibraryController().listOwnChatsPage(
    { cursor: null, filter: "all", limit: 30, query: "" },
    { organizationId: activeWorkspaceId, ownerId: userId }
  );
}

/** Reads one workspace-scoped chat or renders route not-found state. */
export async function getChatPageView(
  chatId: string,
  userId: string,
  workspaceId: string
) {
  const view = await chatLibraryController().getChatForViewer(
    chatId,
    userId,
    workspaceId
  );

  if (!view) {
    notFound();
  }

  return {
    chat: {
      activeStreamId: view.chat.activeStreamId,
      id: view.chat.id,
      isOwner: view.isOwner,
      pinned: view.chat.pinned,
      projectId: view.chat.projectId,
      publicToken: view.chat.publicToken,
      title: view.chat.title,
      visibility: view.chat.visibility,
    },
    messages: view.messages as ChatUIMessage[],
  };
}

/** Reads public chat by public-link token or renders route not-found state. */
export async function getPublicChatView(publicToken: string) {
  const view = await chatLibraryController().getPublicChat(publicToken);

  if (!view) {
    notFound();
  }

  return {
    messages: view.messages as ChatUIMessage[],
    title: view.chat.title,
  };
}
