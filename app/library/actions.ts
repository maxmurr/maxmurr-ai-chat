"use server"

import { refresh } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { resolveLibraryRequestContext } from "@/app/library/library-request-context"
import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"

async function requireLibraryOwnerScope() {
  const context = await resolveLibraryRequestContext(await headers())

  if (context.status === "unauthorized") {
    redirect("/sign-in")
  }

  if (context.status === "workspace-required") {
    redirect("/onboarding")
  }

  return context.scope
}

function libraryController() {
  return resolveApplicationDependency(
    applicationInjectionTokens.libraryController
  )
}

/** Creates flat Folder in active Workspace Library. */
export async function createLibraryFolderAction(name: string) {
  const scope = await requireLibraryOwnerScope()

  try {
    const folder = await libraryController().createFolder(name, scope)
    refresh()
    return { folderId: folder.id, ok: true as const }
  } catch {
    return { error: "Could not create Folder.", ok: false as const }
  }
}

/** Deletes owned File while preserving Chat history placeholder. */
export async function deleteLibraryFileAction(fileId: string) {
  const scope = await requireLibraryOwnerScope()

  try {
    await libraryController().deleteFile(fileId, scope)
    refresh()
    return { ok: true as const }
  } catch {
    return { error: "Could not delete File.", ok: false as const }
  }
}

/** Deletes owned Folder and its Files through database cascade. */
export async function deleteLibraryFolderAction(folderId: string) {
  const scope = await requireLibraryOwnerScope()

  try {
    await libraryController().deleteFolder(folderId, scope)
    refresh()
    return { ok: true as const }
  } catch {
    return { error: "Could not delete Folder.", ok: false as const }
  }
}

/** Moves owned File into owned Folder or Library root. */
export async function moveLibraryFileAction(
  fileId: string,
  folderId: string | null
) {
  const scope = await requireLibraryOwnerScope()

  try {
    await libraryController().moveFile(fileId, folderId, scope)
    refresh()
    return { ok: true as const }
  } catch {
    return { error: "Could not move File.", ok: false as const }
  }
}
