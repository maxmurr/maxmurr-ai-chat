import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type AuthenticationGoogleButtonProps = {
  className?: string
  disabled: boolean
  onClick: () => void
}

/** Renders Google auth divider and provider button. */
export function AuthenticationGoogleButton({
  className,
  disabled,
  onClick,
}: AuthenticationGoogleButtonProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div aria-hidden="true" className="flex items-center gap-3">
        <Separator className="flex-1" />
        <p className="text-xs tracking-wider text-muted-foreground uppercase">
          or
        </p>
        <Separator className="flex-1" />
      </div>

      <Button
        className="h-11 w-full touch-manipulation sm:h-10"
        disabled={disabled}
        onClick={onClick}
        type="button"
        variant="outline"
      >
        <span className="size-4 shrink-0" data-icon="inline-start">
          <Image
            alt=""
            className="size-4 dark:hidden"
            height={16}
            src="/google-logo.svg"
            width={16}
          />
          <Image
            alt=""
            className="hidden size-4 dark:block"
            height={16}
            src="/google-logo-dark.svg"
            width={16}
          />
        </span>
        <span>
          Continue with <span translate="no">Google</span>
        </span>
      </Button>
    </div>
  )
}
