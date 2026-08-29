/** Reasons users can attach to negative assistant response feedback. */
export const chatFeedbackReasons = [
  "Incorrect or incomplete",
  "Not what I asked for",
  "Slow or buggy",
  "Style or tone",
  "Safety or legal concern",
  "Other",
] as const;

/** One negative assistant response feedback reason. */
export type ChatFeedbackReason = (typeof chatFeedbackReasons)[number];
