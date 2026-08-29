import { ProjectSection } from "@/features/project/components/project-section";

/** Renders inert Project Chats placeholder until Chat assignment ships. */
export function ProjectChatsSection({ className }: { className?: string }) {
  return (
    <ProjectSection className={className} id="project-chats" title="Chats">
      <p className="text-base text-pretty text-muted-foreground sm:text-sm">
        No chats in this project yet. Project Chats arrive in a later update.
      </p>
    </ProjectSection>
  );
}
