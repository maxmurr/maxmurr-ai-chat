import Link from "next/link";

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { ProjectSection } from "@/features/project/components/project-section";

/** Lists Chats attached to one owner-visible Project. */
export function ProjectChatsSection({
  chats,
  className,
}: {
  chats: { id: string; title: string; updatedAt: Date }[];
  className?: string;
}) {
  return (
    <ProjectSection className={className} id="project-chats" title="Chats">
      {chats.length === 0 ? (
        <p className="text-base text-pretty text-muted-foreground sm:text-sm">
          No chats in this project yet.
        </p>
      ) : (
        <ItemGroup className="flex flex-col gap-2">
          {chats.map((chat) => (
            <Item className="relative" key={chat.id} variant="outline">
              <ItemContent>
                <ItemTitle>
                  <Link
                    className="outline-none after:absolute after:inset-0"
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
            </Item>
          ))}
        </ItemGroup>
      )}
    </ProjectSection>
  );
}
