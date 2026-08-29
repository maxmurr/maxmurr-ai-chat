import { ProjectSection } from "@/features/project/components/project-section";

/** Renders inert Project Sources placeholder until Sources persistence ships. */
export function ProjectSourcesSection({ className }: { className?: string }) {
  return (
    <ProjectSection className={className} id="project-sources" title="Sources">
      <p className="text-base text-pretty text-muted-foreground sm:text-sm">
        No sources yet. Project Sources arrive in a later update.
      </p>
    </ProjectSection>
  );
}
