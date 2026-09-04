"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRightIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  SquarePenIcon,
} from "lucide-react";

import {
  ChatConversationItem,
  type ChatConversationEntry,
} from "@/features/chat/components/chat-conversation-item";
import type { ChatDialogEntry } from "@/features/chat/components/chat-dialogs";
import {
  ProjectActions,
  type ProjectActionsEntry,
} from "@/features/project/components/project-actions";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { TouchTarget } from "@/components/ui/touch-target";

/** Serializable team chat row rendered in history and search. */
export type ChatHistoryEntry = ChatDialogEntry & {
  updatedAt: Date;
};

type ChatHistoryProjectGroup = ProjectActionsEntry & {
  chats: ChatConversationEntry[];
};

type ChatHistorySection = {
  chats: ChatConversationEntry[];
  label: "Pinned" | "Chats";
  projects: ChatHistoryProjectGroup[];
};

type SerializedChatConversationEntry = Omit<
  ChatConversationEntry,
  "updatedAt"
> & { updatedAt: string };

const ACTIVE_CHAT_ACTIVITY_POLL_INTERVAL_MS = 2_000;
const IDLE_CHAT_ACTIVITY_POLL_INTERVAL_MS = 15_000;

/** Browser event carrying latest owner Chat loading and unread states. */
export const CHAT_ACTIVITY_UPDATED_EVENT = "chat-activity-updated";

/** Detects the open Chat's response stream ending between two activity polls. */
export function hasOpenChatResponseFinished(
  previousChats: ReadonlyArray<
    Pick<ChatConversationEntry, "activeStreamId" | "id" | "updatedAt">
  >,
  nextChats: ReadonlyArray<
    Pick<ChatConversationEntry, "activeStreamId" | "id" | "updatedAt">
  >,
  pathname: string
) {
  const chatId = /^\/chat\/([^/]+)$/.exec(pathname)?.[1];
  const previous = previousChats.find((chat) => chat.id === chatId);
  const next = nextChats.find((chat) => chat.id === chatId);

  return (
    previous !== undefined &&
    next !== undefined &&
    next.activeStreamId === null &&
    (previous.activeStreamId !== null ||
      previous.updatedAt.getTime() !== next.updatedAt.getTime())
  );
}

/** Chooses chat activity poll delay in milliseconds from active response state. */
export function getChatActivityPollIntervalMs(
  chats: ReadonlyArray<Pick<ChatConversationEntry, "activeStreamId">>
) {
  return chats.some(({ activeStreamId }) => activeStreamId !== null)
    ? ACTIVE_CHAT_ACTIVITY_POLL_INTERVAL_MS
    : IDLE_CHAT_ACTIVITY_POLL_INTERVAL_MS;
}

/** Groups pinned Projects while keeping individually pinned Chats standalone. */
export function groupOwnChats(
  ownChats: ChatConversationEntry[],
  projects: ProjectActionsEntry[]
) {
  const pinnedProjects = projects
    .filter(({ pinned }) => pinned)
    .map((project) => ({ ...project, chats: [] as ChatConversationEntry[] }));
  const pinnedProjectsById = new Map(
    pinnedProjects.map((project) => [project.id, project])
  );
  const pinnedChats: ChatConversationEntry[] = [];
  const recentChats: ChatConversationEntry[] = [];

  for (const chat of ownChats) {
    const pinnedProject = chat.projectId
      ? pinnedProjectsById.get(chat.projectId)
      : undefined;

    if (pinnedProject) {
      pinnedProject.chats.push(chat);
    }
    if (chat.pinned) {
      pinnedChats.push(chat);
    } else if (!pinnedProject) {
      recentChats.push(chat);
    }
  }

  for (const project of pinnedProjects) {
    project.chats.sort(
      (first, second) => second.updatedAt.getTime() - first.updatedAt.getTime()
    );
  }

  const sections: ChatHistorySection[] = [];
  if (pinnedProjects.length > 0 || pinnedChats.length > 0) {
    sections.push({
      chats: pinnedChats,
      label: "Pinned",
      projects: pinnedProjects,
    });
  }
  if (recentChats.length > 0) {
    sections.push({ chats: recentChats, label: "Chats", projects: [] });
  }
  return sections;
}

function PinnedProjectHistoryItem({
  pathname,
  project,
  projects,
}: {
  pathname: string;
  project: ChatHistoryProjectGroup;
  projects: ProjectActionsEntry[];
}) {
  let deleteRedirect: "/chat" | "/projects" | undefined;
  if (pathname === `/projects/${project.id}`) {
    deleteRedirect = "/projects";
  } else if (project.chats.some(({ id }) => pathname === `/chat/${id}`)) {
    deleteRedirect = "/chat";
  }

  return (
    <li className="relative">
      <Collapsible>
        <div className="group/project-row relative">
          <SidebarMenuButton
            className="pr-16! pointer-fine:group-hover/project-row:bg-sidebar-accent pointer-fine:group-hover/project-row:text-sidebar-accent-foreground"
            render={<CollapsibleTrigger />}
          >
            <FolderIcon
              aria-hidden="true"
              className="group-data-panel-open/menu-button:hidden"
            />
            <FolderOpenIcon
              aria-hidden="true"
              className="group-not-data-panel-open/menu-button:hidden"
            />
            <span className="truncate">{project.name}</span>
          </SidebarMenuButton>
          <SidebarMenuAction
            aria-label={`Open ${project.name} project`}
            className="top-0.5! right-8! size-7! cursor-pointer text-muted-foreground! group-focus-within/project-row:opacity-100 hover:bg-transparent! hover:text-sidebar-accent-foreground! pointer-fine:opacity-0 pointer-fine:group-hover/project-row:opacity-100"
            render={<Link href={`/projects/${project.id}`} />}
          >
            <SquarePenIcon />
            <TouchTarget />
          </SidebarMenuAction>
          <ProjectActions
            className="absolute top-0.5 right-1 text-muted-foreground! group-focus-within/project-row:opacity-100 hover:bg-transparent! hover:text-sidebar-accent-foreground! data-popup-open:opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover/project-row:opacity-100"
            deleteRedirect={deleteRedirect}
            project={project}
          />
        </div>
        <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
          <SidebarMenu className="pt-0.5" role="list">
            {project.chats.map((chat) => (
              <ChatConversationItem
                chat={chat}
                className="pl-6"
                isActive={pathname === `/chat/${chat.id}`}
                key={chat.id}
                projects={projects}
                showPinAction={false}
                showPinnedChatIcon={false}
                showProjectName={false}
              />
            ))}
          </SidebarMenu>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

/** Renders own and team chat history in the sidebar. */
export function ChatHistory({
  activeWorkspaceId,
  ownChats,
  projects,
  teamChats,
}: {
  activeWorkspaceId: string;
  ownChats: ChatConversationEntry[];
  projects: ProjectActionsEntry[];
  teamChats: ChatHistoryEntry[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [polledOwnChats, setPolledOwnChats] = useState<{
    chats: ChatConversationEntry[];
    source: ChatConversationEntry[];
    workspaceId: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    let isPolling = false;
    let pollTimer: number | undefined;
    let latestChats = ownChats;
    const abortController = new AbortController();

    function scheduleNextChatActivityPoll() {
      window.clearTimeout(pollTimer);
      pollTimer = window.setTimeout(
        () => void refreshChatActivity(),
        getChatActivityPollIntervalMs(latestChats)
      );
    }

    async function refreshChatActivity() {
      if (document.visibilityState !== "visible" || isPolling) {
        return;
      }

      isPolling = true;
      try {
        const response = await fetch("/api/chat/activity", {
          signal: abortController.signal,
        });

        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as {
          chats?: SerializedChatConversationEntry[];
        };

        if (!isMounted || !Array.isArray(result.chats)) {
          return;
        }

        const previousChats = latestChats;
        latestChats = result.chats.map((chat) => ({
          ...chat,
          updatedAt: new Date(chat.updatedAt),
        }));
        window.dispatchEvent(
          new CustomEvent(CHAT_ACTIVITY_UPDATED_EVENT, { detail: latestChats })
        );
        // A response finished elsewhere (Slack, another tab): reload the open Chat once it is idle.
        if (hasOpenChatResponseFinished(previousChats, latestChats, pathname)) {
          router.refresh();
        }
        setPolledOwnChats({
          chats: latestChats,
          source: ownChats,
          workspaceId: activeWorkspaceId,
        });
      } catch {
        // Keep server-rendered history when background status refresh fails.
      } finally {
        isPolling = false;
        if (isMounted) scheduleNextChatActivityPoll();
      }
    }

    function refreshVisibleChatActivity() {
      if (document.visibilityState !== "visible") return;

      window.clearTimeout(pollTimer);
      void refreshChatActivity();
    }

    void refreshChatActivity();
    document.addEventListener("visibilitychange", refreshVisibleChatActivity);
    window.addEventListener("focus", refreshVisibleChatActivity);

    return () => {
      isMounted = false;
      abortController.abort();
      window.clearTimeout(pollTimer);
      document.removeEventListener(
        "visibilitychange",
        refreshVisibleChatActivity
      );
      window.removeEventListener("focus", refreshVisibleChatActivity);
    };
  }, [activeWorkspaceId, ownChats, pathname, router]);

  const currentOwnChats =
    polledOwnChats?.workspaceId === activeWorkspaceId &&
    polledOwnChats.source === ownChats
      ? polledOwnChats.chats
      : ownChats;

  return (
    <>
      {groupOwnChats(currentOwnChats, projects).map((group) => (
        <SidebarGroup
          className="group-data-[collapsible=icon]:hidden"
          key={group.label}
        >
          <Collapsible defaultOpen>
            <div className="group/chat-history-heading relative">
              <SidebarGroupLabel
                className="group/chat-history-trigger cursor-pointer justify-start select-none [&>svg]:size-4 lg:[&>svg]:size-3.5 aria-expanded:pointer-fine:not-hover:not-focus-visible:[&>svg]:opacity-0"
                render={<CollapsibleTrigger />}
              >
                {group.label}
                <ChevronRightIcon
                  aria-hidden="true"
                  className="stroke-sidebar-foreground/50 transition-[opacity,rotate] duration-150 ease-out group-aria-expanded/chat-history-trigger:rotate-90 motion-reduce:transition-none"
                />
              </SidebarGroupLabel>
              {group.label === "Chats" ? (
                <SidebarGroupAction
                  aria-label="View all chats"
                  className="top-1.5! right-1! pointer-events-none opacity-0 group-focus-within/chat-history-heading:pointer-events-auto group-focus-within/chat-history-heading:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100 pointer-fine:group-hover/chat-history-heading:pointer-events-auto pointer-fine:group-hover/chat-history-heading:opacity-100 [&>svg]:size-3.5!"
                  render={<Link href="/chats" />}
                >
                  <ArrowUpRightIcon />
                  <TouchTarget />
                </SidebarGroupAction>
              ) : null}
            </div>
            <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
              <SidebarGroupContent>
                <SidebarMenu role="list">
                  {group.projects.map((project) => (
                    <PinnedProjectHistoryItem
                      key={project.id}
                      pathname={pathname}
                      project={project}
                      projects={projects}
                    />
                  ))}
                  {group.chats.map((chat) => (
                    <ChatConversationItem
                      chat={chat}
                      isActive={pathname === `/chat/${chat.id}`}
                      key={chat.id}
                      projects={projects}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      ))}

      {teamChats.length > 0 && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu role="list">
              {teamChats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    isActive={pathname === `/chat/${chat.id}`}
                    render={<Link href={`/chat/${chat.id}`} />}
                    tooltip={chat.title}
                  >
                    <span className="truncate">{chat.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}
