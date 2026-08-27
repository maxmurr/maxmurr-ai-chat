"use client"

import { useState } from "react"

import { ChatComposerToolbar } from "@/components/chat/chat-composer-toolbar"
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

/** Renders placeholder project chat composer until project chats persist. */
export function ProjectChatComposer({ className }: { className?: string }) {
  const [announcement, setAnnouncement] = useState("")
  const [draft, setDraft] = useState("")

  function announceUnavailableProjectChat() {
    const message = "Project chat persistence is not connected yet."
    setAnnouncement(message)
    toast.add({
      description: "Use New chat in sidebar to start a persisted chat.",
      title: "Project chat unavailable",
      type: "warning",
    })
  }

  return (
    <form
      aria-label="Start a project chat"
      className={cn(className)}
      onSubmit={(event) => {
        event.preventDefault()
        announceUnavailableProjectChat()
      }}
    >
      <InputGroup>
        <InputGroupTextarea
          aria-label="Message"
          autoComplete="off"
          className="min-h-0 px-4"
          data-1p-ignore
          data-lpignore="true"
          enterKeyHint="send"
          name="project-message"
          onChange={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          placeholder="Ask anything…"
          value={draft}
        />
        <ChatComposerToolbar
          canSend={Boolean(draft.trim())}
          isGenerating={false}
          onAnnouncementChange={setAnnouncement}
          onChooseFiles={announceUnavailableProjectChat}
          onStopResponse={() => {}}
        />
      </InputGroup>
      <p className="sr-only" role="status">
        {announcement}
      </p>
    </form>
  )
}
