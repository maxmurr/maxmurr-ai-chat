import Image from "next/image"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AuthenticationGoogleButtonProps = {
  className?: string
  disabled: boolean
  onClick: () => void
}

/** Renders Google authentication provider button. */
export function AuthenticationGoogleButton({
  className,
  disabled,
  onClick,
}: AuthenticationGoogleButtonProps) {
  return (
    <Button
      className={cn("h-11 w-full touch-manipulation", className)}
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
  )
}
