"use client"

import Link from "next/link"
import {
  BadgeCheckIcon,
  BellIcon,
  ChevronsUpDownIcon,
  CreditCardIcon,
  FolderIcon,
  GalleryVerticalEndIcon,
  LibraryBigIcon,
  LogOutIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

const currentUser = {
  name: "maxmurr",
  email: "maxmurr.m@gmail.com",
  avatar: "https://github.com/maxmurr.png",
  initials: "MM",
}

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
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                      size="lg"
                    />
                  }
                >
                  <Avatar>
                    <AvatarImage
                      src={currentUser.avatar}
                      alt={currentUser.name}
                    />
                    <AvatarFallback>{currentUser.initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left leading-4">
                    <div className="truncate font-medium">
                      {currentUser.name}
                    </div>
                    <div className="truncate text-xs">{currentUser.email}</div>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-56"
                  side="bottom"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-0 font-normal text-foreground">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left">
                        <Avatar>
                          <AvatarImage
                            src={currentUser.avatar}
                            alt={currentUser.name}
                          />
                          <AvatarFallback>
                            {currentUser.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid min-w-0 flex-1 text-left text-sm leading-4">
                          <div className="truncate font-medium">
                            {currentUser.name}
                          </div>
                          <div className="truncate text-xs">
                            {currentUser.email}
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <SparklesIcon />
                      Upgrade to Pro
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <BadgeCheckIcon />
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCardIcon />
                      Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BellIcon />
                      Notifications
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <LogOutIcon />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
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
