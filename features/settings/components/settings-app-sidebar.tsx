"use client";

import Link from "next/link";
import {
  ActivityIcon,
  BadgeCheckIcon,
  BookOpenTextIcon,
  BotMessageSquareIcon,
  BracesIcon,
  CableIcon,
  ChartNoAxesColumnIcon,
  ChevronLeftIcon,
  Clock3Icon,
  CpuIcon,
  CreditCardIcon,
  FolderIcon,
  GroupIcon,
  Layers3Icon,
  LayoutGridIcon,
  LockKeyholeIcon,
  MessagesSquareIcon,
  PaintRollerIcon,
  PuzzleIcon,
  RouteIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShieldIcon,
  TelescopeIcon,
  UserRoundIcon,
  UsersRoundIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

type SettingsNavigationItem = {
  href: string;
  icon: LucideIcon;
  items?: SettingsNavigationItem[];
  label: string;
};

type SettingsNavigationGroup = {
  items: SettingsNavigationItem[];
  label: string;
};

const settingsNavigationGroups: SettingsNavigationGroup[] = [
  {
    label: "Personal",
    items: [
      {
        href: "/admin/personal/profile",
        icon: UserRoundIcon,
        label: "Profile",
      },
      {
        href: "/admin/personal/preferences",
        icon: SettingsIcon,
        label: "Preferences",
      },
      {
        href: "/admin/personal/usage",
        icon: ActivityIcon,
        label: "Usage and spend",
      },
      {
        href: "/admin/personal/privacy",
        icon: ShieldIcon,
        label: "Privacy",
      },
      {
        href: "/admin/personal/get-started",
        icon: BadgeCheckIcon,
        label: "Get Started",
      },
    ],
  },
  {
    label: "User management",
    items: [
      {
        href: "/admin/users/members",
        icon: UsersRoundIcon,
        label: "Members",
      },
      { href: "/admin", icon: GroupIcon, label: "Groups" },
      {
        href: "/admin/users/usage",
        icon: ActivityIcon,
        label: "Usage & spend",
      },
      {
        href: "/admin/users/roles",
        icon: ShieldIcon,
        label: "Roles",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        href: "/admin/workspace/overview",
        icon: LayoutGridIcon,
        label: "Overview",
      },
      {
        href: "/admin/workspace/general",
        icon: SettingsIcon,
        label: "General",
      },
      {
        href: "/admin/workspace/models",
        icon: CpuIcon,
        label: "Models",
      },
      {
        href: "/admin/workspace/analytics",
        icon: ChartNoAxesColumnIcon,
        label: "Analytics",
      },
      {
        href: "/admin/workspace/integrations",
        icon: CableIcon,
        label: "Integrations",
        items: [
          {
            href: "/admin/workspace/integrations/add-ins",
            icon: PuzzleIcon,
            label: "Add-ins",
          },
        ],
      },
      {
        href: "/admin/workspace/security",
        icon: LockKeyholeIcon,
        label: "Security",
      },
      {
        href: "/admin/workspace/billing",
        icon: CreditCardIcon,
        label: "Billing",
      },
      {
        href: "/admin/workspace/library",
        icon: FolderIcon,
        label: "Library",
      },
      {
        href: "/admin/workspace/customizations",
        icon: PaintRollerIcon,
        label: "Customizations",
      },
      {
        href: "/admin/workspace/user-onboarding",
        icon: RouteIcon,
        label: "User onboarding",
      },
    ],
  },
  {
    label: "Products",
    items: [
      {
        href: "/admin/products/chat",
        icon: MessagesSquareIcon,
        label: "Chat",
      },
      {
        href: "/admin/products/agents",
        icon: BotMessageSquareIcon,
        label: "Agents",
      },
      {
        href: "/admin/products/skills",
        icon: Layers3Icon,
        label: "Skills",
      },
      {
        href: "/admin/products/workflows",
        icon: ZapIcon,
        label: "Workflows",
      },
      {
        href: "/admin/products/api",
        icon: BracesIcon,
        label: "API",
      },
      {
        href: "/admin/products/deep-research",
        icon: TelescopeIcon,
        label: "Deep research",
      },
      {
        href: "/admin/products/scheduled",
        icon: Clock3Icon,
        label: "Scheduled",
      },
      {
        href: "/admin/products/governance",
        icon: ShieldCheckIcon,
        label: "Governance",
      },
      {
        href: "/admin/products/company-knowledge",
        icon: BookOpenTextIcon,
        label: "Company knowledge",
      },
    ],
  },
];

/** Renders settings navigation with optional active-route state. */
export function SettingsAppSidebar({ pathname }: { pathname?: string }) {
  const { setOpenMobile } = useSidebar();

  function closeMobileSidebar() {
    setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon" data-testid="settings-sidebar" variant="inset">
      <SidebarHeader className="pt-[calc(--spacing(2)+env(safe-area-inset-top))]">
        <nav aria-label="Settings home">
          <SidebarMenu role="list">
            <SidebarMenuItem>
              <SidebarMenuButton
                className="min-h-11 lg:min-h-0"
                render={
                  <Link
                    href="/chat"
                    onNavigate={closeMobileSidebar}
                    transitionTypes={["settings-close"]}
                  />
                }
                tooltip="Back to app"
              >
                <ChevronLeftIcon />
                <span>Back to app</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </nav>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Settings sections">
          {settingsNavigationGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu role="list">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          className="min-h-11 lg:min-h-0"
                          isActive={isActive}
                          render={
                            <Link
                              aria-current={isActive ? "page" : undefined}
                              href={item.href}
                              onNavigate={closeMobileSidebar}
                            />
                          }
                          tooltip={item.label}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>

                        {item.items ? (
                          <SidebarMenuSub role="list">
                            {item.items.map((subItem) => {
                              const isSubItemActive = pathname === subItem.href;

                              return (
                                <SidebarMenuSubItem key={subItem.href}>
                                  <SidebarMenuSubButton
                                    className="min-h-11 lg:min-h-0"
                                    isActive={isSubItemActive}
                                    render={
                                      <Link
                                        aria-current={
                                          isSubItemActive ? "page" : undefined
                                        }
                                        href={subItem.href}
                                        onNavigate={closeMobileSidebar}
                                      />
                                    }
                                  >
                                    <subItem.icon />
                                    <span>{subItem.label}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        ) : null}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="pb-[calc(--spacing(2)+env(safe-area-inset-bottom))] group-data-[collapsible=icon]:hidden">
        <footer className="px-2 text-xs text-sidebar-foreground/50">
          © 2026 <span translate="no">AI Chat</span>
        </footer>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
