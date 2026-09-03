import type { Metadata } from "next";
import { Suspense } from "react";

import {
  BackofficePageContent,
  BackofficePageContentSkeleton,
} from "@/features/backoffice/components/backoffice-page-content";

export const metadata: Metadata = {
  title: "Backoffice – AI Chat",
};

/** Composes account-gated Backoffice entry page. */
export default function BackofficePage() {
  return (
    <main className="p-6" id="main-content">
      <Suspense fallback={<BackofficePageContentSkeleton />}>
        <BackofficePageContent />
      </Suspense>
    </main>
  );
}
