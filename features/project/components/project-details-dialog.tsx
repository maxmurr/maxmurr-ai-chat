"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ProjectDetailsDialogProps = {
  className?: string;
  dialogDescription: string;
  idPrefix: string;
  initialDescription?: string;
  initialName?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (details: {
    description: string;
    name: string;
  }) => Promise<boolean>;
  open: boolean;
  submitLabel: string;
  title: string;
};

/** Collects validated project name and description for create and edit flows. */
export function ProjectDetailsDialog({
  className,
  dialogDescription,
  idPrefix,
  initialDescription = "",
  initialName = "",
  onOpenChange,
  onSubmit,
  open,
  submitLabel,
  title,
}: ProjectDetailsDialogProps) {
  const [description, setDescription] = useState(initialDescription);
  const [name, setName] = useState(initialName);
  const [isSubmitting, startSubmitting] = useTransition();

  function changeOpen(nextOpen: boolean) {
    setDescription(initialDescription);
    setName(initialName);
    onOpenChange(nextOpen);
  }

  function submitProjectDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) return;

    startSubmitting(async () => {
      const saved = await onSubmit({
        description: description.trim(),
        name: trimmedName,
      });

      if (saved) changeOpen(false);
    });
  }

  return (
    <Dialog onOpenChange={changeOpen} open={open}>
      <DialogContent className={cn("sm:max-w-lg", className)}>
        <form className="contents" onSubmit={submitProjectDetails}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
              <Input
                autoComplete="off"
                className="h-11 sm:h-8"
                id={`${idPrefix}-name`}
                maxLength={100}
                name="name"
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder="Pricing revamp"
                required
                spellCheck={false}
                type="text"
                value={name}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor={`${idPrefix}-description`}>
                Description{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FieldLabel>
              <Textarea
                className="min-h-20"
                id={`${idPrefix}-description`}
                maxLength={500}
                name="description"
                onChange={(event) => setDescription(event.currentTarget.value)}
                placeholder="What this project covers"
                value={description}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              className="h-11 sm:h-8"
              disabled={!name.trim() || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
