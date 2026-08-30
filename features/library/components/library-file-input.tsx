"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LIBRARY_FILE_ACCEPT } from "@/src/entities/models/library";

type LibraryFileInputProps = Omit<
  ComponentProps<typeof Input>,
  "accept" | "className" | "multiple" | "onChange" | "type"
> & {
  className?: string;
  onFiles: (files: File[]) => void;
};

/** Normalizes accepted Library File selections and permits reselection. */
export function LibraryFileInput({
  className,
  onFiles,
  ...props
}: LibraryFileInputProps) {
  return (
    <Input
      {...props}
      accept={LIBRARY_FILE_ACCEPT}
      className={cn(className)}
      multiple
      onChange={(event) => {
        const files = Array.from(event.currentTarget.files ?? []);
        event.currentTarget.value = "";
        onFiles(files);
      }}
      type="file"
    />
  );
}
