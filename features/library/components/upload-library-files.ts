export type UploadedLibraryFile = {
  id: string;
  mediaType: string;
  name: string;
  size: number;
};

type LibraryUploadDestination =
  { chatId: string } | { folderId: string } | { projectId: string };

/** Uploads browser Files; server resolves Project Folder destinations. */
export async function uploadLibraryFiles(
  files: readonly File[],
  destination?: LibraryUploadDestination
): Promise<UploadedLibraryFile[]> {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  if (destination) {
    const [field, id] = Object.entries(destination)[0];
    formData.set(field, id);
  }

  const response = await fetch("/api/library/files", {
    body: formData,
    method: "POST",
  });
  const result = (await response.json().catch(() => null)) as {
    error?: string;
    files?: UploadedLibraryFile[];
  } | null;

  if (!response.ok || !result?.files) {
    throw new Error(result?.error ?? "Could not upload Files.");
  }

  return result.files;
}
