"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
  label: "Pinned" | "Recents";
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
    sections.push({ chats: recentChats, label: "Recents", projects: [] });
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
          <SidebarMenuButton className="pr-16!" render={<CollapsibleTrigger />}>
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
            className="top-0.5! right-8! size-7! cursor-pointer text-muted-foreground pointer-fine:opacity-0 pointer-fine:group-hover/project-row:opacity-100 group-focus-within/project-row:opacity-100"
            render={<Link href={`/projects/${project.id}`} />}
          >
            <SquarePenIcon />
            <TouchTarget />
          </SidebarMenuAction>
          <ProjectActions
            className="absolute top-0.5 right-1 data-popup-open:opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover/project-row:opacity-100 group-focus-within/project-row:opacity-100"
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
  ownChats,
  projects,
  teamChats,
}: {
  ownChats: ChatConversationEntry[];
  projects: ProjectActionsEntry[];
  teamChats: ChatHistoryEntry[];
}) {
  const pathname = usePathname();

  return (
    <>
      {groupOwnChats(ownChats, projects).map((group) => (
        <SidebarGroup
          className="group-data-[collapsible=icon]:hidden"
          key={group.label}
        >
          <Collapsible defaultOpen>
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
