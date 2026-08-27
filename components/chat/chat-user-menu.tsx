"use client"

import {
  BadgeCheckIcon,
  BellIcon,
  ChevronsUpDownIcon,
  CreditCardIcon,
  LogOutIcon,
  SparklesIcon,
} from "lucide-react"

import { ChatSidebarIdentity } from "@/components/chat/chat-sidebar-identity"
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
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type ChatUser = {
  avatar: string
  email: string
  initials: string
  name: string
}

type ChatUserMenuProps = {
  className?: string
  user: ChatUser
}

function ChatUserAvatar({
  className,
  user,
}: {
  className?: string
  user: ChatUser
}) {
  return (
    <Avatar className={cn(className)}>
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback>{user.initials}</AvatarFallback>
    </Avatar>
  )
}

/** Renders current user identity and account actions. */
export function ChatUserMenu({ className, user }: ChatUserMenuProps) {
  async function signOutCurrentUser() {
    try {
      const { error } = await authClient.signOut()

      if (error) {
        console.error("Sign-out request failed.")
        return
      }

      window.location.assign(new URL("/sign-in", window.location.origin))
    } catch {
      console.error("Sign-out request failed.")
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
            <DropdownMenuItem onClick={() => void signOutCurrentUser()}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
