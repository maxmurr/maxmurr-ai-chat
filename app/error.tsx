"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { captureSentryClientException } from "@/lib/sentry-client";

/** Recovers unexpected route errors without exposing server details. */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
    captureSentryClientException(error);
  }, [error]);

  return (
    <ErrorState
      className="min-h-dvh"
      description="Try again. If the problem continues, return to your chats."
      id="main-content"
      role="alert"
      title="AI Chat did not load"
    >
      <div className="flex flex-wrap justify-center gap-2">
        <Button className="h-11 sm:h-8" onClick={retry} type="button">
          <RefreshCwIcon data-icon="inline-start" />
          Try again
        </Button>
        <Button
          className="h-11 sm:h-8"
          nativeButton={false}
          render={<Link href="/chat" />}
          variant="outline"
        >
          Go to chats
        </Button>
      </div>
    </ErrorState>
  );
}
