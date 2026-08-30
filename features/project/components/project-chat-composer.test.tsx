import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ProjectChatComposerForm } from "@/features/project/components/project-chat-composer";
import {
  storePendingProjectChat,
  takePendingProjectChat,
} from "@/features/chat/pending-project-chat";

test("Project Chat composer reuses text-first normal Chat composer", () => {
  const markup = renderToStaticMarkup(
    <ProjectChatComposerForm onStartProjectChat={() => {}} />
  );

  assert.match(markup, /aria-label="Message"/);
  assert.match(markup, /aria-label="Send message"/);
  assert.doesNotMatch(markup, /Project chat unavailable/);
  assert.doesNotMatch(markup, /aria-label="Choose files to attach"/);
});

test("pending Project Chat turn transfers once to normal Chat page", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => void values.delete(key),
    setItem: (key: string, value: string) => void values.set(key, value),
  };

  storePendingProjectChat(storage, {
    modelId: "anthropic/claude-sonnet-5",
    projectId: "project-1",
    text: "  Start this Chat  ",
  });

  assert.deepEqual(takePendingProjectChat(storage), {
    modelId: "anthropic/claude-sonnet-5",
    projectId: "project-1",
    text: "Start this Chat",
  });
  assert.equal(takePendingProjectChat(storage), null);
});
