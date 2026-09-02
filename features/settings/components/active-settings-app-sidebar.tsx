"use client";

import { ViewTransition } from "react";
import { usePathname } from "next/navigation";

import { SettingsAppSidebar } from "@/features/settings/components/settings-app-sidebar";

/** Adds URL-dependent active state after settings sidebar prerenders. */
export function ActiveSettingsAppSidebar() {
  const pathname = usePathname();

  return (
    <ViewTransition
      default="none"
      enter={{
        default: "none",
        "settings-open": "settings-sidebar-enter",
      }}
      exit={{
        default: "none",
        "settings-close": "settings-sidebar-exit",
      }}
    >
      <SettingsAppSidebar pathname={pathname} />
    </ViewTransition>
  );
}
