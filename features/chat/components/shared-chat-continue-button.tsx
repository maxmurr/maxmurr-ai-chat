"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { continueSharedChatAction } from "@/features/chat/chat-actions";

/** Continues a public Chat with pending and failure feedback. */
export function SharedChatContinueButton({
  publicToken,
}: {
  publicToken: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function continueSharedChat() {
    startTransition(async () => {
      try {
        const result = await continueSharedChatAction(publicToken);

        if (!result.ok) {
          if ("redirectTo" in result && result.redirectTo) {
            router.push(result.redirectTo);
            return;
          }

          toast.add({
            description: result.error,
            title: "Continue failed",
            type: "error",
          });
          return;
        }

        router.push(`/chat/${encodeURIComponent(result.chatId)}`);
      } catch {
        toast.add({
          description: "Could not continue this chat.",
          title: "Continue failed",
          type: "error",
        });
      }
    });
  }

  return (
    <Button
      disabled={isPending}
      onClick={continueSharedChat}
      size="touch"
      type="button"
    >
      {isPending && <Spinner data-icon="inline-start" />}
      {isPending ? "Continuing…" : "Continue conversation"}
    </Button>
  );
}
