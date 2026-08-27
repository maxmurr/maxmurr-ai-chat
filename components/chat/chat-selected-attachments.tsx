import { FileTextIcon, XIcon } from "lucide-react"

import { TouchTarget } from "@/components/ui/touch-target"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { cn } from "@/lib/utils"

type ChatSelectedAttachmentsProps = {
  className?: string
  files: readonly File[]
  onRemoveFile: (file: File) => void
}

/** Renders files selected for current chat message. */
export function ChatSelectedAttachments({
  className,
  files,
  onRemoveFile,
}: ChatSelectedAttachmentsProps) {
  return (
    <AttachmentGroup className={cn("w-full", className)}>
      {files.map((file) => (
        <Attachment key={`${file.name}-${file.lastModified}`} size="xs">
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{file.name}</AttachmentTitle>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              aria-label={`Remove ${file.name}`}
              className="relative"
              onClick={() => onRemoveFile(file)}
              title={`Remove ${file.name}`}
              type="button"
            >
              <XIcon />
              <TouchTarget />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      ))}
    </AttachmentGroup>
  )
}
