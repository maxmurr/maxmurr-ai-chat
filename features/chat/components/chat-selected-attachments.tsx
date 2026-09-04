import { useEffect, useRef } from "react";
import { FileTextIcon, XIcon } from "lucide-react";

import { TouchTarget } from "@/components/ui/touch-target";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { formatLibraryFileSize } from "@/features/library/components/library-data";
import { cn } from "@/lib/utils";

type ChatSelectedAttachmentsProps = {
  className?: string;
  files: readonly File[];
  onRemoveFile: (file: File) => void;
};

function ChatSelectedAttachmentMedia({ file }: { file: File }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage || !imageRef.current) return;

    const previewUrl = URL.createObjectURL(file);
    imageRef.current.src = previewUrl;
    return () => URL.revokeObjectURL(previewUrl);
  }, [file, isImage]);

  return (
    <AttachmentMedia variant={isImage ? "image" : "icon"}>
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- Temporary blob preview is not an optimized asset.
        <img ref={imageRef} alt="" />
      ) : (
        <FileTextIcon />
      )}
    </AttachmentMedia>
  );
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
        <Attachment key={`${file.name}-${file.lastModified}`} size="sm">
          <ChatSelectedAttachmentMedia file={file} />
          <AttachmentContent>
            <AttachmentTitle>{file.name}</AttachmentTitle>
            <AttachmentDescription>
              {formatLibraryFileSize(file.size)}
            </AttachmentDescription>
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
  );
}
