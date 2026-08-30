import "server-only";

import { createClient } from "redis";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import { after } from "next/server";

import type {
  ChatStreamIdentity,
  ChatStreamStore,
} from "@/src/application/services/chat-stream-store.service.interface";

const CHAT_STREAM_KEY_PREFIX = "maxmurr-ai-chat";
const CHAT_STREAM_CANCEL_TTL_SECONDS = 60;
const REDIS_OPERATION_TIMEOUT_MS = 4_000;
const STOP_ACK_POLL_INTERVAL_MS = 50;

type ChatStreamRedisClient = ReturnType<typeof createClient>;
type ChatStreamRedisClients = {
  publisher: ChatStreamRedisClient;
  subscriber: ChatStreamRedisClient;
};

let chatStreamRedisClientsPromise: Promise<ChatStreamRedisClients> | undefined;
let resumableChatStreamContext: ResumableStreamContext | undefined;

function getChatStreamRedisUrl() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("Chat stream storage error: REDIS_URL is not set");
  }

  return redisUrl;
}

function reportChatStreamRedisError(error: Error) {
  console.error("Chat stream Redis client failed.", error.message);
}

function withRedisDeadline<T>(operation: Promise<T>, operationName: string) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error(`${operationName} timed out.`)),
      REDIS_OPERATION_TIMEOUT_MS
    );
  });

  return Promise.race([operation, deadline]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

async function disconnectRedisClients(clients: ChatStreamRedisClients) {
  await Promise.allSettled(
    [clients.publisher, clients.subscriber]
      .filter((client) => client.isOpen)
      .map((client) => client.disconnect())
  );
}

async function getChatStreamRedisClients(): Promise<ChatStreamRedisClients> {
  if (!chatStreamRedisClientsPromise) {
    const publisher = createClient({
      disableOfflineQueue: true,
      socket: {
        connectTimeout: REDIS_OPERATION_TIMEOUT_MS,
        reconnectStrategy: false,
      },
      url: getChatStreamRedisUrl(),
    });
    const subscriber = publisher.duplicate();
    const clients = { publisher, subscriber };

    publisher.on("error", reportChatStreamRedisError);
    subscriber.on("error", reportChatStreamRedisError);
    chatStreamRedisClientsPromise = withRedisDeadline(
      Promise.all([publisher.connect(), subscriber.connect()]).then(
        () => clients
      ),
      "Chat stream Redis connection"
    ).catch(async (error) => {
      chatStreamRedisClientsPromise = undefined;
      resumableChatStreamContext = undefined;
      await disconnectRedisClients(clients);
      throw error;
    });
  }

  const clients = await chatStreamRedisClientsPromise;

  if (!clients.publisher.isReady || !clients.subscriber.isReady) {
    chatStreamRedisClientsPromise = undefined;
    resumableChatStreamContext = undefined;
    await disconnectRedisClients(clients);
    throw new Error("Chat stream Redis connection is not ready.");
  }

  return clients;
}

async function getResumableChatStreamContext() {
  if (!resumableChatStreamContext) {
    const { publisher, subscriber } = await getChatStreamRedisClients();
    resumableChatStreamContext = createResumableStreamContext({
      keyPrefix: CHAT_STREAM_KEY_PREFIX,
      publisher,
      subscriber,
      waitUntil: after,
    });
  }

  return resumableChatStreamContext;
}

function getChatStreamStorageId(identity: ChatStreamIdentity) {
  return JSON.stringify([
    identity.organizationId,
    identity.ownerId,
    identity.chatId,
    identity.streamId,
  ]);
}

function getChatStreamCancelChannel(storageId: string) {
  return `${CHAT_STREAM_KEY_PREFIX}:cancel:${storageId}`;
}

function getChatStreamCancelKey(storageId: string) {
  return `${CHAT_STREAM_KEY_PREFIX}:cancelled:${storageId}`;
}

function getChatStreamStoppedKey(storageId: string) {
  return `${CHAT_STREAM_KEY_PREFIX}:stopped:${storageId}`;
}

/** Redis-backed replay and acknowledged cancellation for Chat response streams. */
export const redisChatStreamStore: ChatStreamStore = {
  async cancelChatStream(identity) {
    const { publisher } = await getChatStreamRedisClients();
    const storageId = getChatStreamStorageId(identity);
    const stoppedKey = getChatStreamStoppedKey(storageId);
    const cancelRequestId = crypto.randomUUID();

    await withRedisDeadline(
      Promise.all([
        publisher.set(getChatStreamCancelKey(storageId), cancelRequestId, {
          EX: CHAT_STREAM_CANCEL_TTL_SECONDS,
        }),
        publisher.publish(
          getChatStreamCancelChannel(storageId),
          cancelRequestId
        ),
      ]),
      "Chat stream cancellation"
    );

    const deadline = Date.now() + REDIS_OPERATION_TIMEOUT_MS;

    while (Date.now() < deadline) {
      if (
        (await withRedisDeadline(
          publisher.get(stoppedKey),
          "Chat stream stop acknowledgement"
        )) === cancelRequestId
      ) {
        return;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, STOP_ACK_POLL_INTERVAL_MS)
      );
    }

    throw new Error("Chat stream stop acknowledgement timed out.");
  },

  async createChatStream(identity, stream, onCancel) {
    const { publisher, subscriber } = await getChatStreamRedisClients();
    const storageId = getChatStreamStorageId(identity);
    const cancelChannel = getChatStreamCancelChannel(storageId);
    const cancelKey = getChatStreamCancelKey(storageId);
    const stoppedKey = getChatStreamStoppedKey(storageId);
    let cancelRequestId: string | null = null;
    let cancelRequested = false;
    const cancelListener = (nextCancelRequestId: string) => {
      cancelRequestId = nextCancelRequestId;
      if (cancelRequested) return;
      cancelRequested = true;
      onCancel();
    };

    await withRedisDeadline(
      subscriber.subscribe(cancelChannel, cancelListener),
      "Chat stream cancellation subscription"
    );

    try {
      const pendingCancelRequestId = await withRedisDeadline(
        publisher.get(cancelKey),
        "Chat stream cancellation lookup"
      );

      if (pendingCancelRequestId) {
        cancelListener(pendingCancelRequestId);
      }

      const streamContext = await getResumableChatStreamContext();
      const resumableStream = await withRedisDeadline(
        streamContext.createNewResumableStream(storageId, () => stream),
        "Chat stream registration"
      );

      await resumableStream?.pipeTo(new WritableStream());
    } finally {
      await Promise.allSettled([
        ...(cancelRequestId
          ? [
              publisher.set(stoppedKey, cancelRequestId, {
                EX: CHAT_STREAM_CANCEL_TTL_SECONDS,
              }),
            ]
          : []),
        subscriber.unsubscribe(cancelChannel, cancelListener),
        publisher.del(cancelKey),
      ]);
    }
  },

  async resumeChatStream(identity) {
    return withRedisDeadline(
      (await getResumableChatStreamContext()).resumeExistingStream(
        getChatStreamStorageId(identity)
      ),
      "Chat stream resume"
    );
  },
};
