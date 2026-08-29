"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ChatComposer,
  type ChatComposerSubmission,
} from "@/features/chat/components/chat-composer";
import { storePendingProjectChat } from "@/features/chat/pending-project-chat";
import { cn } from "@/lib/utils";

/** Starts owned Project Chat on normal Chat page. */
export function ProjectChatComposer({
  className,
  projectId,
}: {
  className?: string;
  projectId: string;
}) {
  const router = useRouter();

  return (
    <ProjectChatComposerForm
      className={className}
      onStartProjectChat={(text) => {
        storePendingProjectChat(window.sessionStorage, { projectId, text });
        router.push("/chat");
      }}
    />
  );
}

/** Renders text-first Project Chat form using normal Chat composer. */
export function ProjectChatComposerForm({
  className,
  onStartProjectChat,
}: {
  className?: string;
  onStartProjectChat: (text: string) => void;
}) {
  const [announcement, setAnnouncement] = useState("");
  const [draft, setDraft] = useState("");

  async function startProjectChat({ text }: ChatComposerSubmission) {
    onStartProjectChat(text);
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <ChatComposer
        attachments={[]}
        attachmentsEnabled={false}
        className="max-w-none px-0"
        draft={draft}
        isGenerating={false}
        onAnnouncementChange={setAnnouncement}
        onAttachmentsChange={() => {}}
        onDraftChange={setDraft}
        onSendMessage={startProjectChat}
        onStopResponse={() => {}}
      />
      <p className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  );
}
