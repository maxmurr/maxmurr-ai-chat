import { AuthenticatedChatAppFrame } from "@/features/chat/components/authenticated-chat-sidebar";

/** Frames authenticated Chat, Project, and Library routes. */
export default function AuthenticatedAppLayout({ children }: LayoutProps<"/">) {
  return <AuthenticatedChatAppFrame>{children}</AuthenticatedChatAppFrame>;
}
