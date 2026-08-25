/** Describes one file attached to a local demo message. */
export type MockChatAttachment = {
  readonly filename: string
  readonly mediaType: string
  readonly previewImageSrc?: string
}

/** Describes one source cited by a local demo message. */
export type MockChatSource = {
  readonly href?: string
  readonly label: string
  readonly title: string
}

/** Describes one local demo message rendered inside a chat thread. */
export type MockChatMessage = {
  readonly attachments?: readonly MockChatAttachment[]
  readonly content: string
  readonly id: string
  readonly reasoning?: string
  readonly role: "assistant" | "user"
  readonly sources?: readonly MockChatSource[]
}

type MockChatConversation = {
  readonly id: string
  readonly title: string
}

const MOCK_CHAT_REASONING =
  "No model behind this one, it’s a UI demo. Still worth running the full stream lifecycle so the interface behaves the way it would in production."

const MOCK_CHAT_RESPONSE = [
  "This thread is scripted with `@shadcn/helpers/ai-sdk`, so nothing is being sent to a model.",
  "Set `AI_GATEWAY_API_KEY` and the same request reaches a real model instead. Nothing in the UI changes.",
].join("\n\n")

const PRICING_DESIGN_FEEDBACK_TITLE = "Pricing page design feedback"

const PRICING_DESIGN_FEEDBACK_MESSAGES: readonly MockChatMessage[] = [
  {
    attachments: [
      {
        filename: "pricing-current.svg",
        mediaType: "image/svg+xml",
        previewImageSrc: "/pricing-page-preview.png",
      },
      {
        filename: "pricing-brief.pdf",
        mediaType: "application/pdf",
      },
    ],
    content:
      "can you look at our pricing page? something feels off but I can't put my finger on it",
    id: "pricing-review-request",
    role: "user",
  },
  {
    content: [
      "Three things stand out.",
      "**All three plans carry equal visual weight.** Same card size, same border, same button treatment. Nothing tells me where to look, so I have to read all three and decide for myself, and that's work most visitors won't do.",
      "**The feature lists start with infrastructure.** \"99.9% uptime SLA\" is the first bullet on every plan. That's a reason to trust you, not a reason to pick a tier.",
      "**Price and billing period sit at different optical weights.** `$29` is huge, `/month` is small and grey. On the annual toggle the effective price changes but the layout doesn't, so the discount reads as a rounding error.",
      "Which of the three is meant to be the default choice?",
    ].join("\n\n"),
    id: "pricing-review-findings",
    reasoning:
      "I compared hierarchy, feature ordering, pricing typography, and contrast against the supplied page and brief.",
    role: "assistant",
  },
  {
    content: "the middle one is supposed to be the default btw",
    id: "pricing-review-default-plan",
    role: "user",
  },
  {
    content: [
      "Then the layout is working against you.",
      "Lift the middle card through size, border contrast, and a filled button. Skip the badge; hierarchy should make the default obvious without another label.",
      "Move differentiating features above shared infrastructure. Visitors should understand why the plans differ before reading why they should trust you.",
      "For the washed-out secondary text, darken `--muted-foreground` and measure it against the muted surface, not the page background.",
    ].join("\n\n"),
    id: "pricing-review-hierarchy",
    role: "assistant",
  },
  {
    content: "can you give me the token values",
    id: "pricing-review-token-request",
    role: "user",
  },
  {
    content: [
      "Here's the darkened pair. Both clear 4.5:1 against their own background:",
      [
        "```css",
        ":root {",
        "  /* was oklch(0.556 0 0), 3.1:1 on muted */",
        "  --muted-foreground: oklch(0.478 0 0); /* 4.7:1 */",
        "}",
        "",
        ".dark {",
        "  /* was oklch(0.708 0 0), 3.4:1 on muted */",
        "  --muted-foreground: oklch(0.769 0 0); /* 4.8:1 */",
        "}",
        "```",
      ].join("\n"),
      "Check these against your muted surface specifically, not the page background, since that's where the failure was.",
    ].join("\n\n"),
    id: "pricing-review-token-values",
    role: "assistant",
  },
  {
    content: "perfect",
    id: "pricing-review-token-confirmation",
    role: "user",
  },
  {
    content:
      "That closes the contrast issue. Recheck after applying the tokens in case the card surface changed too.",
    id: "pricing-review-contrast-follow-up",
    role: "assistant",
  },
  {
    content: "better. what about the CTA labels",
    id: "pricing-review-cta-request",
    role: "user",
  },
  {
    content: [
      'All three currently say "Get started", which wastes the strongest piece of copy on the page.',
      "Differentiate by what actually happens:",
      [
        "| Plan | Label |",
        "| --- | --- |",
        "| Free | Start building |",
        "| Team | Start 14-day trial |",
        "| Enterprise | Talk to sales |",
      ].join("\n"),
      'Now the button tells you what you\'re committing to. "Talk to sales" also stops enterprise visitors from bouncing off a signup form they were never going to complete.',
    ].join("\n\n"),
    id: "pricing-review-cta-labels",
    role: "assistant",
  },
  {
    content: '"Start building", I like that',
    id: "pricing-review-cta-confirmation",
    role: "user",
  },
  {
    content:
      "It sets the right expectation too: you're not signing up for an account, you're starting work.",
    id: "pricing-review-cta-follow-up",
    role: "assistant",
  },
  {
    content: "ok I think I have enough. thanks 🙏",
    id: "pricing-review-wrap-up",
    role: "user",
  },
  {
    content: [
      "Summary of what to ship first:",
      [
        "1. **Hierarchy.** Lift the middle card via size, border contrast, and a filled button. No badge.",
        "2. **Above the fold.** Lead the feature lists with what differs between tiers; move shared claims below the cards.",
        "3. **Copy.** Headline to _\"Start free. Upgrade when you outgrow it.\"_; CTA labels differentiated per plan.",
        "4. **Contrast.** Darken `--muted-foreground` at the token level and re-measure.",
      ].join("\n"),
      "The comparison table can wait until you know whether the fold changes that 41%.",
    ].join("\n\n"),
    id: "pricing-review-summary",
    role: "assistant",
  },
  {
    content: "actually, can you put that in a doc?",
    id: "pricing-review-document-request",
    role: "user",
  },
  {
    attachments: [
      {
        filename: "pricing-page-review.md",
        mediaType: "text/markdown",
      },
      {
        filename: "pricing-fold-annotated.svg",
        mediaType: "image/svg+xml",
        previewImageSrc: "/pricing-page-preview.png",
      },
    ],
    content:
      "Written up, including the analytics and contrast results so whoever picks this up has the reasoning and not just the conclusions.",
    id: "pricing-review-documents",
    role: "assistant",
    sources: [
      {
        href: "https://stripe.com/billing",
        label: "stripe.com",
        title: "Billing overview",
      },
      {
        href: "https://www.paddle.com/blog/why-usage-based-pricing",
        label: "paddle.com",
        title: "Usage-based pricing, explained",
      },
      {
        label: "pricing-research.pdf",
        title: "Q3 pricing research",
      },
    ],
  },
]

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
        id: "8255b62d-cc10-410f-9c83-67e95852fb34",
        title: PRICING_DESIGN_FEEDBACK_TITLE,
      },
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

  if (conversationTitle === PRICING_DESIGN_FEEDBACK_TITLE) {
    return [...PRICING_DESIGN_FEEDBACK_MESSAGES]
  }

  return [
    {
      content: conversationTitle,
      id: "initial-user-message",
      role: "user",
    },
    {
      content: MOCK_CHAT_RESPONSE,
      id: "initial-assistant-message",
      reasoning: MOCK_CHAT_REASONING,
      role: "assistant",
    },
  ]
}
