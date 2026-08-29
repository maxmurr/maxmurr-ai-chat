import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type WorkspaceInvitationCardProps = {
  children?: ReactNode
  className?: string
  contentClassName?: string
  description: ReactNode
  footer?: ReactNode
  footerClassName?: string
  title: ReactNode
}

/** Renders shared workspace invitation card heading, body, and footer slots. */
export function WorkspaceInvitationCard({
  children,
  className,
  contentClassName,
  description,
  footer,
  footerClassName,
  title,
}: WorkspaceInvitationCardProps) {
  return (
    <Card
      className={cn(
        "w-full max-w-md [--card-spacing:--spacing(6)]",
        className,
      )}
      data-testid="invitation-content"
    >
      <CardHeader>
        <CardTitle>
          <h1>{title}</h1>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children && (
        <CardContent className={cn(contentClassName)}>{children}</CardContent>
      )}
      {footer && (
        <CardFooter className={cn(footerClassName)}>{footer}</CardFooter>
      )}
    </Card>
  )
}
