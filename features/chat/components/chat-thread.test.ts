import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  ChatComposer,
  isChatFilePickerShortcut,
  validateChatComposerMessage,
} from "@/features/chat/components/chat-composer";
import { getChatGreeting } from "@/features/chat/components/chat-message-list";
import { DEFAULT_CHAT_MODEL_ID } from "@/src/entities/models/chat-model";
import {
  replaceChatUserMessageText,
  resolveChatFileUploadDestination,
} from "@/features/chat/components/chat-thread";

test("chat composer mounts native form controls", () => {
  const markup = renderToStaticMarkup(
    createElement(ChatComposer, {
      attachments: [],
      draft: "",
      isGenerating: false,
      onAnnouncementChange() {},
      onAttachmentsChange() {},
      onDraftChange() {},
      onModelChange() {},
      async onSendMessage() {},
      onStopResponse() {},
      selectedModelId: DEFAULT_CHAT_MODEL_ID,
    })
  );

  assert.match(markup, /aria-label="Message"/);
  assert.match(markup, /aria-label="Add attachments and tools"/);
  assert.match(markup, /Grok Build 0\.1/);
  assert.match(markup, /aria-label="Send message"/);
});

test("chat file picker shortcut accepts Command or Control plus U", () => {
  assert.equal(
    isChatFilePickerShortcut({ ctrlKey: false, key: "u", metaKey: true }),
    true
  );
  assert.equal(
    isChatFilePickerShortcut({ ctrlKey: true, key: "U", metaKey: false }),
    true
  );
  assert.equal(
    isChatFilePickerShortcut({ ctrlKey: false, key: "u", metaKey: false }),
    false
  );
  assert.equal(
    isChatFilePickerShortcut({ ctrlKey: false, key: "k", metaKey: true }),
    false
  );
});

test("chat composer requires text or an attachment", () => {
  assert.equal(
    validateChatComposerMessage("  ", []),
    "Enter a message or attach a file."
  );
  assert.equal(validateChatComposerMessage("Hello", []), undefined);
});

test("chat greeting follows local time of day", () => {
  assert.equal(getChatGreeting(11), "Good morning");
  assert.equal(getChatGreeting(12), "Good afternoon");
  assert.equal(getChatGreeting(16), "Good afternoon");
  assert.equal(getChatGreeting(17), "Good evening");
});

test("edited Chat prompt keeps its file parts", () => {
  const editedMessage = replaceChatUserMessageText(
    {
      id: "message-1",
      metadata: { createdAt: "2026-08-28T01:02:03.000Z" },
      parts: [
        {
          filename: "brief.txt",
          mediaType: "text/plain",
          type: "file",
          url: "/api/library/files/file-1",
        },
        { text: "Original prompt", type: "text" },
      ],
      role: "user",
    },
    "Edited prompt"
  );

  assert.deepEqual(editedMessage.parts, [
    {
      filename: "brief.txt",
      mediaType: "text/plain",
      type: "file",
      url: "/api/library/files/file-1",
    },
    { text: "Edited prompt", type: "text" },
  ]);
});

test("second-turn Chat uploads use persisted Chat destination before refresh", () => {
  assert.deepEqual(resolveChatFileUploadDestination("chat-1", false, 1), {
    chatId: "chat-1",
  });
  assert.equal(resolveChatFileUploadDestination("chat-1", false, 0), undefined);
});
