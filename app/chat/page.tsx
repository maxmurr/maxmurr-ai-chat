"use client"

import Link from "next/link"
import {
  FolderIcon,
  GalleryVerticalEndIcon,
  LibraryBigIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const primaryNavigation = [
  { label: "New chat", href: "/chat", icon: PlusIcon },
  { label: "Search", href: "#search", icon: SearchIcon },
  { label: "Projects", href: "#projects", icon: FolderIcon },
  { label: "Library", href: "#library", icon: LibraryBigIcon },
]

const conversationGroups = [
  { label: "Pinned", conversations: ["Checkout 500s"] },
  {
    label: "Today",
    conversations: [
      "Review our pricing page",
      "Summarise this week’s incidents",
      "Billing: build or buy",
      "New onboarding flow",
    ],
  },
]

export default function ChatPage() {
  return (
    <SidebarProvider className="isolate h-svh">
      <Sidebar collapsible="icon" variant="floating">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/chat" aria-label="Acme Inc. home" />}
                size="lg"
                tooltip="Acme Inc."
              >
                <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEndIcon />
                </span>
                <div className="grid min-w-0 flex-1 text-left">
                  <div className="truncate font-medium">Acme Inc.</div>
                  <div className="truncate text-xs">Enterprise</div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <SidebarMenu>
            {primaryNavigation.map((item) => (
              <SidebarMenuItem
                key={item.label}
                id={item.href.startsWith("#") ? item.href.slice(1) : undefined}
              >
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {conversationGroups.map((group) => (
            <SidebarGroup
              className="group-data-[collapsible=icon]:hidden"
              key={group.label}
            >
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.conversations.map((conversation) => (
                    <SidebarMenuItem key={conversation}>
                      <SidebarMenuButton
                        render={<Link href="/chat" />}
                        title={conversation}
                      >
                        <span>{conversation}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<a href="mailto:maxmurr.m@gmail.com" />}
                size="lg"
                tooltip="maxmurr"
              >
                <Avatar>
                  <AvatarImage
                    src="https://github.com/maxmurr.png"
                    alt="@maxmurr"
                  />
                  <AvatarFallback>MM</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left">
                  <div className="truncate font-medium">maxmurr</div>
                  <div className="truncate text-xs">maxmurr.m@gmail.com</div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 px-3">
          <SidebarTrigger aria-label="Toggle sidebar" />
          <Separator
            className="data-vertical:h-4 data-vertical:self-auto"
            orientation="vertical"
          />
          <p className="truncate text-sm">New chat</p>
        </header>
        <div className="min-h-0 flex-1" />
      </SidebarInset>
    </SidebarProvider>
  )
}
