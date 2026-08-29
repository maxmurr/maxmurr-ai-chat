export type UploadedLibraryFile = {
  id: string;
  mediaType: string;
  name: string;
  size: number;
};

/** Uploads browser Files to owner-scoped Library route. */
export async function uploadLibraryFiles(
  files: readonly File[],
  folderId: string | null = null,
  projectId: string | null = null
): Promise<UploadedLibraryFile[]> {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  if (folderId) {
    formData.set("folderId", folderId);
  }

  if (projectId) {
    formData.set("projectId", projectId);
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
