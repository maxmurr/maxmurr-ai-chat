/** Approved Chat response models in composer display order. */
export const chatModelOptions = [
  { id: "anthropic/claude-opus-5", label: "Claude Opus 5" },
  { id: "anthropic/claude-sonnet-5", label: "Claude Sonnet 5" },
  { id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
  { id: "openai/gpt-5.6-sol", label: "GPT-5.6 Sol" },
  { id: "openai/gpt-5.6-luna", label: "GPT-5.6 Luna" },
  { id: "spacexai/grok-build-0.1", label: "Grok Build 0.1" },
] as const;

/** Approved Vercel AI Gateway model for Chat responses. */
export type ChatModelId = (typeof chatModelOptions)[number]["id"];

/** Default Chat response model shown in composer. */
export const DEFAULT_CHAT_MODEL_ID: ChatModelId = "spacexai/grok-build-0.1";

/** Reports whether untrusted value names approved Chat response model. */
export function isChatModelId(value: unknown): value is ChatModelId {
  return (
    typeof value === "string" &&
    chatModelOptions.some((model) => model.id === value)
  );
}
