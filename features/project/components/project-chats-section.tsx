"use client";

import { startTransition, useOptimistic } from "react";
import Link from "next/link";
import { MessageSquareIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { toast } from "@/components/ui/toast";
import { TouchTarget } from "@/components/ui/touch-target";
import { dispatchOptimisticChatListAction } from "@/features/chat/hooks/use-optimistic-chat-list";
import { ProjectSection } from "@/features/project/components/project-section";
import { detachChatFromProjectAction } from "@/features/project/project-actions";

/** Lists Chats attached to one owner-visible Project. */
export function ProjectChatsSection({
  chats,
  className,
}: {
  chats: { id: string; title: string; updatedAt: Date }[];
  className?: string;
}) {
  const [optimisticChats, removeOptimisticChat] = useOptimistic(
    chats,
    (currentChats, chatId: string) =>
      currentChats.filter((chat) => chat.id !== chatId)
  );

  function removeChatFromProject(chatId: string) {
    startTransition(async () => {
      removeOptimisticChat(chatId);
      dispatchOptimisticChatListAction({
        chatId,
        changes: { projectId: null, projectName: null },
        type: "update",
      });
      const result = await detachChatFromProjectAction(chatId);

      if (!result.ok) {
        toast.add({
          description: result.error,
          title: "Project update failed",
          type: "error",
        });
      }
    });
  }

  return (
    <ProjectSection className={className} id="project-chats" title="Chats">
      {optimisticChats.length === 0 ? (
        <p className="text-base text-pretty text-muted-foreground sm:text-sm">
          No chats in this project yet.
        </p>
      ) : (
        <ItemGroup className="flex flex-col gap-2">
          {optimisticChats.map((chat) => (
            <Item
              className="relative has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50"
              key={chat.id}
              role="listitem"
              variant="outline"
            >
              <ItemMedia variant="icon">
                <MessageSquareIcon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  <Link
                    className="outline-none after:absolute after:inset-0 pointer-fine:group-hover/item:underline"
                    href={`/chat/${chat.id}`}
                  >
                    {chat.title}
                  </Link>
                </ItemTitle>
                <ItemDescription>
                  <time dateTime={chat.updatedAt.toISOString()}>
                    {chat.updatedAt.toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      timeZone: "UTC",
                    })}
                  </time>
                </ItemDescription>
              </ItemContent>
              <ItemActions className="relative">
                <Button
                  aria-label={`Remove ${chat.title} from Project`}
                  className="relative opacity-0 group-focus-within/item:opacity-100 group-hover/item:opacity-100 pointer-coarse:opacity-100"
                  onClick={() => removeChatFromProject(chat.id)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <XIcon />
                  <TouchTarget />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}
    </ProjectSection>
  );
}
