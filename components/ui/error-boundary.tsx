"use client";

import { catchError, type ErrorInfo } from "next/error";
import { RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";

type ErrorFallbackProps = {
  description?: string;
  title: string;
  variant?: "default" | "sidebar";
};

function RetryButton({ retry }: { retry: () => void }) {
  return (
    <Button className="h-11 sm:h-8" onClick={retry} type="button">
      <RefreshCwIcon data-icon="inline-start" />
      Try again
    </Button>
  );
}

function ErrorFallback(
  {
    description = "Try again. If the problem continues, refresh the page.",
    title,
    variant = "default",
  }: ErrorFallbackProps,
  { retry }: ErrorInfo
) {
  if (variant === "sidebar") {
    return (
      <Sidebar collapsible="icon" variant="inset">
        <SidebarContent className="p-2">
          <ErrorState
            className="p-3 group-data-[collapsible=icon]:hidden"
            description={description}
            role="alert"
            title={title}
          >
            <RetryButton retry={retry} />
          </ErrorState>
          <div className="hidden min-h-0 flex-1 items-center justify-center group-data-[collapsible=icon]:flex">
            <Button
              aria-label="Try again"
              onClick={retry}
              size="icon-sm"
              type="button"
            >
              <RefreshCwIcon />
            </Button>
          </div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    );
  }

  return (
    <ErrorState description={description} role="alert" title={title}>
      <RetryButton retry={retry} />
    </ErrorState>
  );
}

/** Catches fallible server sections without swallowing Next.js control flow. */
export const ErrorBoundary = catchError(ErrorFallback);
