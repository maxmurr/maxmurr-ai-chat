import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

/** Gives unknown routes one clear path back into the app. */
export default function NotFound() {
  return (
    <main className="isolate flex min-h-dvh" id="main-content">
      <ErrorState
        description="This link may be outdated, or the page may have moved."
        icon={
          <FileQuestionIcon
            aria-hidden="true"
            className="size-5 text-muted-foreground"
          />
        }
        title="Page not found"
      >
        <Button
          nativeButton={false}
          render={<Link href="/chat" />}
          size="touch"
        >
          Go to chats
        </Button>
      </ErrorState>
    </main>
  );
}
