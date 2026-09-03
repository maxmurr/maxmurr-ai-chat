import { redirect } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUserSession } from "@/features/user/user-queries";
import { accountRoleCanAccessBackoffice } from "@/src/entities/models/account-role";

/** Authorizes and renders Backoffice entry content. */
export async function BackofficePageContent() {
  const { session } = await getCurrentUserSession();

  if (!session) {
    redirect("/sign-in?callbackURL=%2Fbackoffice");
  }

  if (!accountRoleCanAccessBackoffice(session.user.accountRole)) {
    redirect("/chat");
  }

  return <h1 className="text-2xl font-semibold">Backoffice</h1>;
}

/** Reserves Backoffice heading while account access resolves. */
export function BackofficePageContentSkeleton() {
  return <Skeleton aria-label="Loading Backoffice" className="h-8 w-40" />;
}
