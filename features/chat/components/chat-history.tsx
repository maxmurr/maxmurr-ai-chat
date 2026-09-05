"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { useChatActivityPolling } from "@/features/chat/hooks/use-chat-activity-polling";
import { useOptimisticChatList } from "@/features/chat/hooks/use-optimistic-chat-list";
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
import { cn } from "@/lib/utils";

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
  className,
  pathname,
  project,
  projects,
}: {
  className?: string;
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
    <li className={cn("relative", className)}>
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

function OwnChatHistoryGroup({
  className,
  group,
  pathname,
  projects,
}: {
  className?: string;
  group: ChatHistorySection;
  pathname: string;
  projects: ProjectActionsEntry[];
}) {
  return (
    <SidebarGroup
      className={cn("group-data-[collapsible=icon]:hidden", className)}
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
              className="pointer-events-none top-1.5! right-1! opacity-0 group-focus-within/chat-history-heading:pointer-events-auto group-focus-within/chat-history-heading:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100 pointer-fine:group-hover/chat-history-heading:pointer-events-auto pointer-fine:group-hover/chat-history-heading:opacity-100 [&>svg]:size-3.5!"
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
  );
}

function TeamChatHistoryGroup({
  chats,
  className,
  pathname,
}: {
  chats: ChatHistoryEntry[];
  className?: string;
  pathname: string;
}) {
  return (
    <SidebarGroup
      className={cn("group-data-[collapsible=icon]:hidden", className)}
    >
      <SidebarGroupLabel>Team</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu role="list">
          {chats.map((chat) => (
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
  );
}

/** Renders own and team Chat history in the sidebar. */
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
  const currentOwnChats = useChatActivityPolling({
    activeWorkspaceId,
    ownChats,
    pathname,
  });
  const optimisticOwnChats = useOptimisticChatList(currentOwnChats);

  return (
    <>
      {groupOwnChats(optimisticOwnChats, projects).map((group) => (
        <OwnChatHistoryGroup
          group={group}
          key={group.label}
          pathname={pathname}
          projects={projects}
        />
      ))}

      {teamChats.length > 0 && (
        <TeamChatHistoryGroup chats={teamChats} pathname={pathname} />
      )}
    </>
  );
}
