import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type WorkspaceOnboardingStepFormProps = Omit<
  ComponentProps<"form">,
  "title"
> & {
  description: ReactNode;
  title: string;
  titleId: string;
};

/** Frames one Workspace onboarding form with shared step heading. */
export function WorkspaceOnboardingStepForm({
  children,
  className,
  description,
  title,
  titleId,
  ...props
}: WorkspaceOnboardingStepFormProps) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <header className="flex flex-col gap-2">
        <h1
          className="text-2xl font-semibold tracking-tight text-balance"
          id={titleId}
        >
          {title}
        </h1>
        <p className="text-base/7 text-pretty text-muted-foreground sm:text-sm/6">
          {description}
        </p>
      </header>
      {children}
    </form>
  );
}
