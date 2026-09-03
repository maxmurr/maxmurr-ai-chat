"use client";

import { useId, useState, useTransition } from "react";
import { ThumbsDownIcon, ThumbsUpIcon, type LucideIcon } from "lucide-react";

import { updateChatResponseFeedbackAction } from "@/features/chat/chat-actions";
import {
  chatFeedbackReasons,
  type ChatFeedbackReason,
} from "@/features/chat/chat-feedback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { cn } from "@/lib/utils";

type ChatMessageFeedbackProps = {
  chatId: string;
  disabled: boolean;
  messageId: string;
};

type SubmittedChatFeedback = "negative" | "positive" | null;

function ChatMessageFeedbackButton({
  active,
  activeAriaLabel,
  className,
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  activeAriaLabel: string;
  className?: string;
  disabled: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  const tooltipLabel = active ? "Remove feedback" : label;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={active ? activeAriaLabel : label}
            aria-pressed={active}
            className={cn("relative", className)}
            disabled={disabled}
            onClick={onClick}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Icon className={active ? "fill-current" : undefined} />
            <TouchTarget />
          </Button>
        }
      />
      <TooltipContent side="bottom">{tooltipLabel}</TooltipContent>
    </Tooltip>
  );
}

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
        <ChatMessageFeedbackButton
          active={submittedFeedback === "positive"}
          activeAriaLabel="Remove positive feedback"
          disabled={controlsDisabled}
          icon={ThumbsUpIcon}
          label="Good response"
          onClick={() =>
            updateChatResponseFeedback(
              submittedFeedback === "positive" ? null : "positive"
            )
          }
        />
      )}

      {submittedFeedback !== "positive" && (
        <ChatMessageFeedbackButton
          active={submittedFeedback === "negative"}
          activeAriaLabel="Remove negative feedback"
          disabled={controlsDisabled}
          icon={ThumbsDownIcon}
          label="Bad response"
          onClick={() =>
            submittedFeedback === "negative"
              ? updateChatResponseFeedback(null)
              : setDialogOpen(true)
          }
        />
      )}

      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent className="sm:max-w-xl">
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
                  size="lg"
                  spacing={2}
                  value={reasons}
                  variant="outline"
                >
                  {chatFeedbackReasons.map((reason) => (
                    <ToggleGroupItem
                      className="rounded-full pointer-coarse:h-11"
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
                  autoComplete="off"
                  className="min-h-24"
                  disabled={isPending}
                  id={detailsId}
                  maxLength={500}
                  name="details"
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Share details (optional)…"
                  value={details}
                />
              </Field>
            </FieldGroup>

            <DialogDescription className="rounded-lg bg-muted p-3">
              Your conversation will be included with your feedback to help
              improve responses.
            </DialogDescription>

            <DialogFooter>
              <Button
                className="pointer-coarse:h-11"
                disabled={isPending || reasons.length === 0}
                size="lg"
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
