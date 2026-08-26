import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { ChatPageShell } from "@/components/chat/chat-page-shell"
import { auth } from "@/di/authentication"

/** Authorizes current session and renders empty new-chat page. */
export default async function ChatPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/sign-in")
  }

  const name = session.user.username ?? session.user.name

  return (
    <ChatPageShell
      currentUser={{
        avatar: session.user.image ?? "",
        email: session.user.email,
        initials: name.slice(0, 2).toUpperCase(),
        name,
      }}
    />
  )
}
