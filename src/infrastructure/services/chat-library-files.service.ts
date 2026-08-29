import { Buffer } from "node:buffer";

import type { FileUIPart, UIMessage } from "ai";

import type { LibraryService } from "@/src/application/services/library.service.interface";
import { LibraryAccessDeniedError } from "@/src/entities/errors/library-errors";
import {
  createLibraryFileDownloadUrl,
  getLibraryFileExtension,
  getLibraryFileIdFromDownloadUrl,
  isLibraryTextMediaType,
  type LibraryOwnerScope,
} from "@/src/entities/models/library";

// ponytail: inline first 1 MB as provider fallback; add extraction/chunking if
// large text Files must be fully queryable by models that ignore file_data.
const MODEL_TEXT_FILE_FALLBACK_BYTES = 1_000_000;

/**
 * Replaces Library download URLs in message file parts with data URLs the
 * model provider can read. Deleted Files degrade to a short text note.
 */
export async function hydrateLibraryFilesForModel(
  messages: UIMessage[],
  libraryService: LibraryService,
  scope: LibraryOwnerScope
) {
  const fileCache = new Map<
    string,
    ReturnType<LibraryService["downloadFile"]>
  >();
  const hydratedMessages: UIMessage[] = [];

  for (const message of messages) {
    const parts: UIMessage["parts"] = [];

    for (const part of message.parts) {
      if (part.type !== "file") {
        parts.push(part);
        continue;
      }

      const fileId = getLibraryFileIdFromDownloadUrl(part.url);
      if (!fileId) {
        parts.push(part);
        continue;
      }

      let filePromise = fileCache.get(fileId);
      if (!filePromise) {
        filePromise = libraryService.downloadFile(fileId, scope);
        fileCache.set(fileId, filePromise);
      }

      try {
        const file = await filePromise;
        parts.push({
          ...part,
          filename: file.name,
          mediaType: file.mediaType,
          url: `data:${file.mediaType};base64,${Buffer.from(file.bytes).toString("base64")}`,
        } satisfies FileUIPart);

        if (isLibraryTextMediaType(file.mediaType)) {
          const fallbackBytes = file.bytes.subarray(
            0,
            MODEL_TEXT_FILE_FALLBACK_BYTES
          );
          const wasTruncated = fallbackBytes.byteLength < file.bytes.byteLength;
          parts.push({
            text: [
              `Attached File "${file.name}" contents${wasTruncated ? " (first 1 MB)" : ""}:`,
              "",
              new TextDecoder().decode(fallbackBytes),
            ].join("\n"),
            type: "text",
          });
        }
      } catch (error) {
        if (!(error instanceof LibraryAccessDeniedError)) {
          throw error;
        }

        parts.push({
          text: `Attached File "${part.filename ?? "Attachment"}" is no longer available.`,
          type: "text",
        });
      }
    }

    hydratedMessages.push({ ...message, parts });
  }

  return hydratedMessages;
}

const controlCharacterPattern = /[\u0000-\u001f\u007f]/;

function generatedFileName(part: FileUIPart, index: number) {
  const reportedName = part.filename?.trim() ?? "";
  const isUsableName =
    reportedName.length > 0 &&
    reportedName.length <= 255 &&
    !controlCharacterPattern.test(reportedName);

  return isUsableName
    ? reportedName
    : `generated-${index + 1}${getLibraryFileExtension(part.mediaType)}`;
}

/**
 * Persists assistant-emitted data-URL file parts with Provenance, resolving
 * Project Folder only when generated Files exist, and returns saved File ids.
 */
export async function saveAssistantGeneratedFiles(
  message: UIMessage,
  chatId: string,
  libraryService: LibraryService,
  resolveChatFileFolderId: () => Promise<string | null>,
  scope: LibraryOwnerScope
): Promise<{ message: UIMessage; savedFileIds: string[] }> {
  const generatedParts = message.parts.flatMap((part, partIndex) =>
    part.type === "file" && part.url.startsWith("data:")
      ? [{ part, partIndex }]
      : []
  );

  if (generatedParts.length === 0) {
    return { message, savedFileIds: [] };
  }

  const inputs = await Promise.all(
    generatedParts.map(async ({ part }, index) => {
      const response = await fetch(part.url);

      return {
        bytes: new Uint8Array(await response.arrayBuffer()),
        mediaType: part.mediaType,
        name: generatedFileName(part, index),
        provenanceChatId: chatId,
        provenanceMessageId: message.id,
      };
    })
  );
  const folderId = await resolveChatFileFolderId();
  const savedFiles = await libraryService.saveGeneratedFiles(
    inputs,
    scope,
    folderId
  );
  const filesByPartIndex = new Map(
    generatedParts.map(({ partIndex }, index) => [partIndex, savedFiles[index]])
  );

  return {
    message: {
      ...message,
      parts: message.parts.map((part, partIndex) => {
        const file = filesByPartIndex.get(partIndex);
        return file
          ? {
              ...part,
              filename: file.name,
              mediaType: file.mediaType,
              url: createLibraryFileDownloadUrl(file.id),
            }
          : part;
      }),
    },
    savedFileIds: savedFiles.map(({ id }) => id),
  };
}
