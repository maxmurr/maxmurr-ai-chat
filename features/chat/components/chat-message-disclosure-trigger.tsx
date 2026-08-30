import type { ComponentProps, ReactNode } from "react";
import { ChevronDownIcon } from "lucide-react";

import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { cn } from "@/lib/utils";

type ChatMessageDisclosureTriggerProps = Omit<
  ComponentProps<typeof Marker>,
  "children" | "render"
> & {
  contentClassName?: string;
  contentProps?: Omit<
    ComponentProps<typeof MarkerContent>,
    "children" | "className"
  >;
  icon: ReactNode;
  label: ReactNode;
};

/** Renders shared Marker trigger chrome for expandable message details. */
export function ChatMessageDisclosureTrigger({
  className,
  contentClassName,
  contentProps,
  icon,
  label,
  ...props
}: ChatMessageDisclosureTriggerProps) {
  return (
    <Marker
      className={cn(className)}
      render={<CollapsibleTrigger />}
      {...props}
    >
      <MarkerIcon>{icon}</MarkerIcon>
      <MarkerContent className={cn(contentClassName)} {...contentProps}>
        {label}
      </MarkerContent>
      <MarkerIcon>
        <ChevronDownIcon className="transition-transform group-aria-expanded/marker:rotate-180" />
      </MarkerIcon>
    </Marker>
  );
}
