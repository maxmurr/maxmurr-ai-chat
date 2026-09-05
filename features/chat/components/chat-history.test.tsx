import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { ChatConversationEntry } from "@/features/chat/components/chat-conversation-item";
import {
  ChatHistory,
  groupOwnChats,
} from "@/features/chat/components/chat-history";
import { getChatActivityPollIntervalMs } from "@/features/chat/hooks/use-chat-activity-polling";
import { reduceOptimisticChatList } from "@/features/chat/hooks/use-optimistic-chat-list";
import type { ProjectActionsEntry } from "@/features/project/components/project-actions";
import { SidebarProvider } from "@/components/ui/sidebar";

const ownChats: ChatConversationEntry[] = [
  {
    activeStreamId: null,
    hasUnreadResponse: false,
    id: "project-chat",
    pinned: false,
    projectId: "project-1",
    projectName: "Launch",
    publicToken: null,
    title: "Project chat",
    updatedAt: new Date("2025-01-02T00:00:00Z"),
    visibility: "private",
  },
  {
    activeStreamId: null,
    hasUnreadResponse: false,
    id: "pinned-project-chat",
    pinned: true,
    projectId: "project-1",
    projectName: "Launch",
    publicToken: null,
    title: "Pinned project chat",
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    visibility: "private",
  },
  {
    activeStreamId: null,
    hasUnreadResponse: false,
    id: "pinned-chat",
    pinned: true,
    projectId: null,
    projectName: null,
    publicToken: null,
    title: "Standalone pinned",
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    visibility: "private",
  },
  {
    activeStreamId: null,
    hasUnreadResponse: false,
    id: "project-recent-chat",
    pinned: false,
    projectId: "project-2",
    projectName: "Backlog",
    publicToken: null,
    title: "Backlog chat",
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    visibility: "private",
  },
  {
    activeStreamId: null,
    hasUnreadResponse: false,
    id: "recent-chat",
    pinned: false,
    projectId: null,
    projectName: null,
    publicToken: null,
    title: "Recent chat",
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    visibility: "private",
  },
];

const projects: ProjectActionsEntry[] = [
  {
    description: null,
    id: "project-1",
    name: "Launch",
    pinned: true,
  },
  {
    description: null,
    id: "project-2",
    name: "Backlog",
    pinned: false,
  },
];

test("chat grouping keeps pinned Project Chats inside and outside their folder", () => {
  const [pinnedSection, recentSection] = groupOwnChats(ownChats, projects);

  assert.deepEqual(
    pinnedSection?.projects[0]?.chats.map(({ id }) => id),
    ["project-chat", "pinned-project-chat"]
  );
  assert.deepEqual(
    pinnedSection?.chats.map(({ id }) => id),
    ["pinned-project-chat", "pinned-chat"]
  );
  assert.deepEqual(
    recentSection?.chats.map(({ id }) => id),
    ["project-recent-chat", "recent-chat"]
  );
});

test("optimistic Chat updates patch and delete list entries", () => {
  const renamedChats = reduceOptimisticChatList(ownChats, {
    chatId: "recent-chat",
    changes: {
      pinned: true,
      projectId: "project-2",
      projectName: "Backlog",
      title: "Renamed chat",
    },
    type: "update",
  });
  const remainingChats = reduceOptimisticChatList(renamedChats, {
    chatIds: ["pinned-chat"],
    type: "delete",
  });

  assert.partialDeepStrictEqual(
    remainingChats.find(({ id }) => id === "recent-chat"),
    {
      pinned: true,
      projectId: "project-2",
      projectName: "Backlog",
      title: "Renamed chat",
    }
  );
  assert.equal(
    remainingChats.some(({ id }) => id === "pinned-chat"),
    false
  );
  assert.equal(ownChats.at(-1)?.title, "Recent chat");
});

test("chat activity polling stays fast only while a response is active", () => {
  assert.equal(getChatActivityPollIntervalMs(ownChats), 15_000);
  assert.equal(
    getChatActivityPollIntervalMs([
      { ...ownChats[0]!, activeStreamId: "stream-1" },
    ]),
    2_000
  );
});

test("chat history defaults pinned Project folders closed", () => {
  const markup = renderToStaticMarkup(
    <SidebarProvider>
      <ChatHistory
        activeWorkspaceId="workspace-1"
        ownChats={ownChats}
        projects={projects}
        teamChats={[]}
      />
    </SidebarProvider>
  );

  const pinnedSectionIndex = markup.indexOf(">Pinned<");
  const pinnedProjectChatIndex = markup.indexOf(">Pinned project chat<");
  const recentSectionIndex = markup.indexOf(">Chats<");
  const backlogChatIndex = markup.indexOf(">Backlog chat<");

  assert.ok(pinnedSectionIndex >= 0);
  assert.ok(pinnedProjectChatIndex > pinnedSectionIndex);
  assert.ok(recentSectionIndex > pinnedProjectChatIndex);
  assert.ok(backlogChatIndex > recentSectionIndex);
  assert.match(markup, />Launch</);
  assert.doesNotMatch(markup, /aria-label="Project chat"/);
  assert.doesNotMatch(markup, /group\/menu-item relative pl-6/);
  assert.match(
    markup,
    /lucide-folder[^\"]*group-data-panel-open\/menu-button:hidden/
  );
  assert.match(
    markup,
    /lucide-folder-open[^\"]*group-not-data-panel-open\/menu-button:hidden/
  );
  const openProjectAction = markup.match(
    /<a[^>]*aria-label="Open Launch project"[^>]*>/
  )?.[0];
  const projectOptionsAction = markup.match(
    /<button[^>]*aria-label="More options for Launch"[^>]*>/
  )?.[0];
  const viewAllChatsLink = markup.match(
    /<a[^>]*aria-label="View all chats"[^>]*>/
  )?.[0];

  assert.match(
    markup,
    /pointer-fine:group-hover\/project-row:bg-sidebar-accent/
  );
  assert.match(
    markup,
    /pointer-fine:group-hover\/project-row:text-sidebar-accent-foreground/
  );
  assert.ok(openProjectAction);
  assert.ok(projectOptionsAction);
  for (const action of [openProjectAction, projectOptionsAction]) {
    assert.match(action, /text-muted-foreground!/);
    assert.match(action, /hover:bg-transparent!/);
    assert.match(action, /hover:text-sidebar-accent-foreground!/);
  }
  assert.match(markup, /href="\/projects\/project-1"/);
  assert.match(markup, /lucide-square-pen/);
  assert.ok(viewAllChatsLink);
  assert.match(viewAllChatsLink, /href="\/chats"/);
  assert.match(
    viewAllChatsLink,
    /pointer-fine:group-hover\/chat-history-heading:opacity-100/
  );
  assert.match(
    viewAllChatsLink,
    /group-focus-within\/chat-history-heading:opacity-100/
  );
  assert.match(viewAllChatsLink, /pointer-coarse:opacity-100/);
  assert.match(markup, /lucide-arrow-up-right/);
  assert.equal(markup.match(/aria-label="Pinned project chat"/g)?.length, 1);
  assert.equal(
    markup.match(/aria-label="Unpin Pinned project chat"/g)?.length,
    1
  );
  assert.match(markup, /aria-label="Unpin Standalone pinned"/);
  assert.equal(markup.match(/lucide-message-circle/g)?.length, 2);

  assert.match(markup, /title="Backlog chat · Backlog"/);
  assert.doesNotMatch(markup, />Backlog chat · Backlog</);
  assert.match(
    markup,
    /class="[^"]*motion-reduce:transition-none[^"]*lg:pointer-fine:translate-x-12[^"]*lg:pointer-fine:group-hover\/menu-item:translate-x-0[^"]*">Backlog<\/span>/
  );
  assert.match(markup, /bg-\(--conversation-actions-background\)/);
  assert.match(markup, />Recent chat</);
  assert.doesNotMatch(markup, /Recent chat ·/);

  assert.equal(markup.match(/aria-expanded="true"/g)?.length, 2);
  assert.match(markup, /aria-expanded="false"/);
  assert.match(markup, /lucide-chevron-right/);
  assert.match(
    markup,
    /aria-expanded:pointer-fine:not-hover:not-focus-visible/
  );
  assert.match(markup, /transition-\[opacity,rotate\]/);
  assert.match(markup, /group-aria-expanded\/chat-history-trigger:rotate-90/);
  assert.doesNotMatch(markup, />Today</);
  assert.doesNotMatch(markup, />Yesterday</);
});

test("chat history shows resumable loading and unread response states", () => {
  const activityChats = ownChats.map((chat) =>
    chat.id === "project-recent-chat"
      ? { ...chat, activeStreamId: "stream-1" }
      : chat.id === "recent-chat"
        ? { ...chat, hasUnreadResponse: true }
        : chat
  );
  const markup = renderToStaticMarkup(
    <SidebarProvider>
      <ChatHistory
        activeWorkspaceId="workspace-1"
        ownChats={activityChats}
        projects={projects}
        teamChats={[]}
      />
    </SidebarProvider>
  );

  assert.match(markup, /aria-label="Backlog chat, generating response"/);
  assert.match(markup, /motion-reduce:animate-none/);
  assert.match(markup, /aria-label="Recent chat, unread response"/);
  assert.match(markup, /data-slot="chat-unread-indicator"/);
  assert.match(markup, /bg-status-unread/);
});
