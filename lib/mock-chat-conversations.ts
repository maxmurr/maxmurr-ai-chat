/** Describes one local demo message rendered inside a chat thread. */
export type MockChatMessage = {
  readonly attachments?: readonly string[]
  readonly content: readonly string[]
  readonly id: string
  readonly presentation?: "demo-intro"
  readonly reasoning?: string
  readonly role: "assistant" | "user"
}

type MockChatConversation = {
  readonly id: string
  readonly title: string
}

const MOCK_CHAT_REASONING =
  "No model behind this one, it’s a UI demo. Still worth running the full stream lifecycle so the interface behaves the way it would in production."

const MOCK_CHAT_RESPONSE = [
  "This thread is scripted with @shadcn/helpers/ai-sdk, so nothing is being sent to a model.",
  "Set AI_GATEWAY_API_KEY and the same request reaches a real model instead. Nothing in the UI changes.",
] as const

type MockChatConversationGroup = {
  readonly conversations: readonly MockChatConversation[]
  readonly label: string
}

/** Stable mock chat data; committed UUIDs keep routes valid across renders and title changes. */
export const mockChatConversationGroups: readonly MockChatConversationGroup[] = [
  {
    label: "Pinned",
    conversations: [
      {
        id: "35177dd9-3ed8-402b-8acd-f28ad7bc3f93",
        title: "Checkout 500s",
      },
    ],
  },
  {
    label: "Today",
    conversations: [
      {
        id: "de9c5f7b-8fcd-4486-937a-dd72132a8bc2",
        title: "Review our pricing page",
      },
      {
        id: "40fda618-6339-4936-8cb7-df548f781097",
        title: "Summarise this week’s incidents",
      },
      {
        id: "51dfd3da-c28d-4fd7-9d2d-3441744a2ae3",
        title: "Billing: build or buy",
      },
      {
        id: "7200d336-7e37-442d-aeb9-daab292cb921",
        title: "New onboarding flow",
      },
    ],
  },
]

/** Flat mock chat list used by route lookup and static page generation. */
export const mockChatConversations = mockChatConversationGroups.flatMap(
  ({ conversations }) => conversations
)

/** Creates seeded demo messages for existing chats and none for new chats. */
export function buildMockChatMessages(
  conversationTitle?: string
): MockChatMessage[] {
  if (!conversationTitle) {
    return []
  }

  return [
    {
      content: [conversationTitle],
      id: "initial-user-message",
      role: "user",
    },
    {
      content: MOCK_CHAT_RESPONSE,
      id: "initial-assistant-message",
      presentation: "demo-intro",
      reasoning: MOCK_CHAT_REASONING,
      role: "assistant",
    },
  ]
}
