---
status: accepted
---

# Slack threads link to app Chats through Workspace member email

ADR 0005 kept Slack history in Mastra storage and web history in app tables, so the same person saw two unrelated conversations. Mastra Harness Channels run one Agent Controller session per Slack thread, and that session already persists a Mastra thread. We now link that Mastra thread to exactly one app Chat and keep both stores in step.

- The Chat id is derived from the Slack thread id, and the Mastra thread takes the same id (`resolveThreadId`), so either store can find the other without a mapping table.
- The Slack author's email resolves a Workspace member. A new thread creates the Chat in that member's earliest Workspace, owned by that member. A non-member gets a sign-in hint and no model call.
- Slack turns are mirrored into the Chat: the user message before dispatch, the assistant reply from the session's `message_end` event. The Slack run claims the Chat's response stream, so the web sidebar shows loading and unread state and concurrent web sends conflict as usual.
- Web turns on a linked Chat send only the new message with `memory: { thread: chatId }`, so the Chat Assistant reads shared history from the Mastra thread; the channel output processor posts the reply into the Slack thread, and the web turn text is posted there first.

This narrows the Chat definition: a linked Chat also records Messages from other Workspace members who post in its Slack thread, tagged with the author's name. Ownership, sharing, and web appends remain the owner's alone. Web-only Chats are unchanged and stateless in Mastra.
