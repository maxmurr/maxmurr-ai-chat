"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TouchTarget } from "@/components/ui/touch-target";

/** Returns opposite resolved theme for public-link Chat toggle. */
export function getNextSharedChatTheme(resolvedTheme: string | undefined) {
  return resolvedTheme === "dark" ? "light" : "dark";
}

/** Toggles public-link Chat between light and dark themes. */
export function SharedChatThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label="Toggle theme"
            className="relative"
            onClick={() => setTheme(getNextSharedChatTheme(resolvedTheme))}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <SunIcon className="dark:hidden" />
            <MoonIcon className="not-dark:hidden" />
            <TouchTarget />
          </Button>
        }
      />
      <TooltipContent side="bottom">Toggle theme</TooltipContent>
    </Tooltip>
  );
}
