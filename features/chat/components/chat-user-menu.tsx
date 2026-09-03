"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  BellIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
  MoonIcon,
  PaletteIcon,
  SettingsIcon,
  SunIcon,
} from "lucide-react";

import { ChatSidebarIdentity } from "@/features/chat/components/chat-sidebar-identity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { signOutUserAction } from "@/features/user/user-actions";
import { cn } from "@/lib/utils";

type ChatUser = {
  avatar: string;
  email: string;
  initials: string;
  name: string;
};

type ChatUserMenuProps = {
  className?: string;
  isWorkspaceAdmin: boolean;
  user: ChatUser;
};

function ChatUserAvatar({
  className,
  user,
}: {
  className?: string;
  user: ChatUser;
}) {
  return (
    <Avatar className={cn(className)}>
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback>{user.initials}</AvatarFallback>
    </Avatar>
  );
}

/** Renders current user identity and account actions. */
export function ChatUserMenu({
  className,
  isWorkspaceAdmin,
  user,
}: ChatUserMenuProps) {
  const { setTheme, theme } = useTheme();

  async function signOutCurrentUser() {
    try {
      const result = await signOutUserAction();

      if (!result.ok) {
        console.error("Sign-out request failed.");
        return;
      }

      window.location.assign(new URL("/sign-in", window.location.origin));
    } catch {
      console.error("Sign-out request failed.");
    }
  }

  return (
    <SidebarMenuItem className={cn(className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              size="lg"
            />
          }
        >
          <ChatUserAvatar user={user} />
          <ChatSidebarIdentity
            className="leading-4"
            description={user.email}
            title={user.name}
          />
          <ChevronsUpDownIcon className="ml-auto" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56" side="bottom">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 font-normal text-foreground">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left">
                <ChatUserAvatar user={user} />
                <ChatSidebarIdentity
                  className="text-base/4 sm:text-sm"
                  description={user.email}
                  title={user.name}
                />
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <PaletteIcon />
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-44">
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="system">
                    <PaletteIcon />
                    System (default)
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="light">
                    <SunIcon />
                    Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <MoonIcon />
                    Dark
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {isWorkspaceAdmin ? (
              <DropdownMenuItem
                render={
                  <Link href="/admin" transitionTypes={["settings-open"]} />
                }
              >
                <SettingsIcon />
                Settings
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem>
              <BellIcon />
              Notifications
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => void signOutCurrentUser()}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
