"use client";

import { useId, useState, useTransition } from "react";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";

import { updateChatResponseFeedbackAction } from "@/features/chat/chat-actions";
import {
  chatFeedbackReasons,
  type ChatFeedbackReason,
} from "@/features/chat/chat-feedback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "@/components/ui/toast";
import { TouchTarget } from "@/components/ui/touch-target";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ChatMessageFeedbackProps = {
  chatId: string;
  disabled: boolean;
  messageId: string;
};

type SubmittedChatFeedback = "negative" | "positive" | null;

/** Collects one thumbs score and optional negative feedback details. */
export function ChatMessageFeedback({
  chatId,
  disabled,
  messageId,
}: ChatMessageFeedbackProps) {
  const [details, setDetails] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [reasons, setReasons] = useState<ChatFeedbackReason[]>([]);
  const [submittedFeedback, setSubmittedFeedback] =
    useState<SubmittedChatFeedback>(null);
  const detailsId = useId();
  const reasonsId = useId();
  const controlsDisabled = disabled || isPending;

  function updateChatResponseFeedback(
    value: SubmittedChatFeedback,
    selectedReasons: readonly ChatFeedbackReason[] = [],
    selectedDetails = ""
  ) {
    if (isPending) {
      return;
    }

    const previousFeedback = submittedFeedback;
    setSubmittedFeedback(value);

    startTransition(async () => {
      try {
        const result = await updateChatResponseFeedbackAction({
          chatId,
          details: selectedDetails,
          messageId,
          reasons: selectedReasons,
          value,
        });

        if (!result.ok) {
          throw new Error(result.error);
        }

        setDetails("");
        setDialogOpen(false);
        setReasons([]);
      } catch {
        setSubmittedFeedback(previousFeedback);
        toast.add({
          description: "Try again.",
          title: "Feedback failed",
          type: "error",
        });
      }
    });
  }

  function submitNegativeFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateChatResponseFeedback("negative", reasons, details);
  }

  return (
    <>
      {submittedFeedback !== "negative" && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label={
                  submittedFeedback === "positive"
                    ? "Remove positive feedback"
                    : "Good response"
                }
                aria-pressed={submittedFeedback === "positive"}
                className="relative"
                disabled={controlsDisabled}
                onClick={() =>
                  updateChatResponseFeedback(
                    submittedFeedback === "positive" ? null : "positive"
                  )
                }
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <ThumbsUpIcon
                  className={
                    submittedFeedback === "positive"
                      ? "fill-current"
                      : undefined
                  }
                />
                <TouchTarget />
              </Button>
            }
          />
          <TooltipContent>
            {submittedFeedback === "positive"
              ? "Remove feedback"
              : "Good response"}
          </TooltipContent>
        </Tooltip>
      )}

      {submittedFeedback !== "positive" && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label={
                  submittedFeedback === "negative"
                    ? "Remove negative feedback"
                    : "Bad response"
                }
                aria-pressed={submittedFeedback === "negative"}
                className="relative"
                disabled={controlsDisabled}
                onClick={() =>
                  submittedFeedback === "negative"
                    ? updateChatResponseFeedback(null)
                    : setDialogOpen(true)
                }
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <ThumbsDownIcon
                  className={
                    submittedFeedback === "negative"
                      ? "fill-current"
                      : undefined
                  }
                />
                <TouchTarget />
              </Button>
            }
          />
          <TooltipContent>
            {submittedFeedback === "negative"
              ? "Remove feedback"
              : "Bad response"}
          </TooltipContent>
        </Tooltip>
      )}

      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form className="contents" onSubmit={submitNegativeFeedback}>
            <DialogHeader>
              <DialogTitle>Share feedback</DialogTitle>
            </DialogHeader>

            <FieldGroup>
              <FieldSet>
                <FieldLegend className="sr-only" id={reasonsId}>
                  What went wrong?
                </FieldLegend>
                <ToggleGroup
                  aria-labelledby={reasonsId}
                  className="w-full flex-wrap justify-start"
                  disabled={isPending}
                  multiple
                  onValueChange={(values) =>
                    setReasons(values as ChatFeedbackReason[])
                  }
                  spacing={2}
                  value={reasons}
                  variant="outline"
                >
                  {chatFeedbackReasons.map((reason) => (
                    <ToggleGroupItem
                      className="h-10 rounded-full px-3.5 pointer-coarse:h-11"
                      key={reason}
                      value={reason}
                    >
                      {reason}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FieldSet>

              <Field>
                <FieldLabel className="sr-only" htmlFor={detailsId}>
                  Feedback details
                </FieldLabel>
                <Textarea
                  className="min-h-24"
                  disabled={isPending}
                  id={detailsId}
                  maxLength={500}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Share details (optional)"
                  value={details}
                />
              </Field>

              <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                Your conversation will be included with your feedback to help
                improve responses.
              </p>
            </FieldGroup>

            <DialogFooter className="m-0 border-0 bg-transparent p-0">
              <Button
                className="h-11 sm:h-9"
                disabled={isPending || reasons.length === 0}
                type="submit"
              >
                {isPending && <Spinner data-icon="inline-start" />}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
