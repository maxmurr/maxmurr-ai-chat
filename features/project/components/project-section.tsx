import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ProjectSectionProps = Omit<ComponentProps<"section">, "title"> & {
  action?: ReactNode;
  title: string;
};

/** Groups one project detail section under a shared heading and action slot. */
export function ProjectSection({
  action,
  children,
  className,
  title,
  ...props
}: ProjectSectionProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)} {...props}>
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-base font-medium sm:text-sm">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
