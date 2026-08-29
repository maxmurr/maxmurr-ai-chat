"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FolderIcon,
  LibraryBigIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const primaryNavigation = [
  { label: "New chat", href: "/chat", icon: PlusIcon },
  { label: "Search", href: "#search", icon: SearchIcon },
  { label: "Projects", href: "/projects", icon: FolderIcon },
  { label: "Library", href: "/library", icon: LibraryBigIcon },
]

/** Renders app navigation with client-derived active route. */
export function ChatPrimaryNavigation({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <SidebarMenu className={cn(className)}>
      {primaryNavigation.map((item) => (
        <SidebarMenuItem
          key={item.label}
          id={item.href.startsWith("#") ? item.href.slice(1) : undefined}
        >
          <SidebarMenuButton
            isActive={
              item.href === "/chat"
                ? pathname === "/chat"
                : item.href.startsWith("/") &&
                  (pathname === item.href ||
                    pathname.startsWith(`${item.href}/`))
            }
            render={<Link href={item.href} />}
            tooltip={item.label}
          >
            <item.icon />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
