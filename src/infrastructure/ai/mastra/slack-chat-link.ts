import { createHash, randomUUID } from "node:crypto";

import { MessageList } from "@mastra/core/agent";
import type { AgentControllerEvent } from "@mastra/core/agent-controller";
import type { MastraDBMessage } from "@mastra/core/agent/message-list";
import type {
  ChannelHandler,
  ChannelSessionStart,
  ResolveThreadId,
} from "@mastra/core/channels";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import {
  CHAT_RESPONSE_STREAM_STALE_AFTER_MS,
  type ChatMessage,
  type ChatMessageSender,
} from "@/src/entities/models/chat";

const SLACK_CHAT_TITLE_LIMIT = 80;
const SIGN_IN_HINT =
  "I can only answer Workspace members. Sign in to the chat app with this Slack email first, then message me again.";

type SlackChatLinkRepository = Pick<
  ChatRepository,
  | "claimChatResponseStream"
  | "createChat"
  | "findWorkspaceMemberByEmail"
  | "finishChatResponseStream"
  | "getChatById"
  | "saveMessage"
  | "saveMessageIfAbsent"
>;
type SlackMessage = Parameters<ChannelHandler>[1];

/** Derives one stable Chat id per Slack thread; Mastra thread mapping and retries agree on it. */
export function chatIdForSlackThread(externalThreadId: string) {
  const bytes = createHash("sha1")
    .update(`maxmurr-ai-chat:slack-thread:${externalThreadId}`)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Drops unresolved Slack user-id mentions such as the bot's own `@U0BUG911T7C`. */
function stripSlackUserIds(text: string) {
  return text
    .replace(/<?@U[A-Z0-9]{6,}>?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toSlackUserMessage(
  message: SlackMessage,
  sender: ChatMessageSender
): ChatMessage {
  const text = stripSlackUserIds(message.text);

  return {
    id: message.id,
    metadata: {
      createdAt: message.metadata.dateSent.toISOString(),
      sender,
    },
    parts: [
      ...(text ? [{ text, type: "text" }] : []),
      ...message.attachments.map((attachment) => ({
        text: `[Attachment: ${attachment.name ?? attachment.type}]`,
        type: "text",
      })),
    ],
    role: "user",
  };
}

function toAssistantMessage(message: MastraDBMessage): ChatMessage | null {
  const [uiMessage] = new MessageList()
    .add([message], "memory")
    .get.all.aiV6.ui();

  if (!uiMessage?.parts.length) {
    return null;
  }

  return {
    id: message.id,
    metadata: { createdAt: message.createdAt.toISOString() },
    parts: uiMessage.parts,
    role: "assistant",
  };
}

/** Links each Slack thread to one app Chat and mirrors Slack turns into it. */
export function createSlackChatLink(chatRepository: SlackChatLinkRepository) {
  const slackRunStreams = new Map<string, string>();

  async function claimSlackRun(chatId: string) {
    const streamId = randomUUID();

    if (!(await chatRepository.claimChatResponseStream(chatId, streamId))) {
      const chat = await chatRepository.getChatById(chatId);
      const isStale =
        chat?.activeStreamId &&
        Date.now() - chat.updatedAt.getTime() >=
          CHAT_RESPONSE_STREAM_STALE_AFTER_MS;

      if (!isStale) return;

      await chatRepository.finishChatResponseStream(
        chatId,
        chat.activeStreamId,
        false
      );

      if (!(await chatRepository.claimChatResponseStream(chatId, streamId))) {
        return;
      }
    }

    slackRunStreams.set(chatId, streamId);
  }

  const handleMessage: ChannelHandler = async (
    thread,
    message,
    defaultHandler
  ) => {
    const chatId = chatIdForSlackThread(thread.id);
    const chat = await chatRepository.getChatById(chatId);
    const member = message.author.email
      ? await chatRepository.findWorkspaceMemberByEmail(
          message.author.email,
          chat?.organizationId
        )
      : null;

    if (!member) {
      console.warn(
        message.author.email
          ? `Slack message refused: ${message.author.email} is not a Workspace member.`
          : "Slack message refused: Slack sent no author email. Grant the users:read.email scope and reinstall the app."
      );
      if (thread.isDM || message.isMention) await thread.post(SIGN_IN_HINT);
      return;
    }

    if (!chat) {
      await chatRepository
        .createChat({
          id: chatId,
          organizationId: member.organizationId,
          ownerId: member.userId,
          projectId: null,
          title:
            stripSlackUserIds(message.text).slice(0, SLACK_CHAT_TITLE_LIMIT) ||
            "Slack conversation",
        })
        .catch(async (error) => {
          // Slack redelivers on slow replies; a racing webhook may have created the Chat.
          if (!(await chatRepository.getChatById(chatId))) throw error;
        });
    }

    const userMessage = toSlackUserMessage(message, {
      ...(member.userAvatarUrl ? { avatarUrl: member.userAvatarUrl } : {}),
      displayName: member.userDisplayName,
      userId: member.userId,
    });
    if (userMessage.parts.length > 0) {
      await chatRepository.saveMessageIfAbsent(chatId, userMessage);
    }

    await claimSlackRun(chatId);
    await defaultHandler(thread, message);
  };

  const resolveThreadId: ResolveThreadId = ({ thread }) =>
    chatIdForSlackThread(thread.id);

  async function mirrorSessionEvent(
    chatId: string,
    event: AgentControllerEvent
  ) {
    // Web-started runs persist their own reply and hold the stream claim.
    const streamId = slackRunStreams.get(chatId);
    if (!streamId) return;

    try {
      if (event.type === "message_end" && event.message.role === "assistant") {
        const assistantMessage = toAssistantMessage(event.message);
        if (assistantMessage) {
          await chatRepository.saveMessage(chatId, assistantMessage);
        }
      } else if (event.type === "agent_end") {
        slackRunStreams.delete(chatId);
        await chatRepository.finishChatResponseStream(
          chatId,
          streamId,
          event.reason !== "error"
        );
      }
    } catch (error) {
      console.error(
        "Slack Chat mirror failed.",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  const onSessionStart: ChannelSessionStart = ({ session, thread }) => {
    let queue = Promise.resolve();
    session.subscribe((event) => {
      queue = queue.then(() => mirrorSessionEvent(thread.id, event));
    });
  };

  return { handleMessage, onSessionStart, resolveThreadId };
}
