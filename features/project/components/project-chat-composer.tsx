"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ChatComposer,
  type ChatComposerSubmission,
} from "@/features/chat/components/chat-composer";
import { storePendingProjectChat } from "@/features/chat/pending-project-chat";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CHAT_MODEL_ID,
  type ChatModelId,
} from "@/src/entities/models/chat-model";

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
      onStartProjectChat={(text, modelId, webSearchEnabled) => {
        storePendingProjectChat(window.sessionStorage, {
          modelId,
          projectId,
          text,
          webSearchEnabled,
        });
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
  onStartProjectChat: (
    text: string,
    modelId: ChatModelId,
    webSearchEnabled: boolean
  ) => void;
}) {
  const [announcement, setAnnouncement] = useState("");
  const [draft, setDraft] = useState("");
  const [selectedModelId, setSelectedModelId] = useState<ChatModelId>(
    DEFAULT_CHAT_MODEL_ID
  );
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  async function startProjectChat({
    modelId,
    text,
    webSearchEnabled,
  }: ChatComposerSubmission) {
    onStartProjectChat(text, modelId, webSearchEnabled);
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
        onModelChange={setSelectedModelId}
        onSendMessage={startProjectChat}
        onStopResponse={() => {}}
        onWebSearchChange={setWebSearchEnabled}
        selectedModelId={selectedModelId}
        webSearchEnabled={webSearchEnabled}
      />
      <p className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  );
}
