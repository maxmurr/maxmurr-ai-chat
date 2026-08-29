"use client"

import { catchError, type ErrorInfo } from "next/error"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

function ErrorFallback(
  { title }: { title: string },
  { retry }: ErrorInfo
) {
  return (
    <Alert className="m-4" variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>Try loading this section again.</span>
        <Button onClick={() => retry()} size="sm" variant="outline">
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
}

/** Catches fallible server sections without swallowing Next.js control flow. */
export const ErrorBoundary = catchError(ErrorFallback)
