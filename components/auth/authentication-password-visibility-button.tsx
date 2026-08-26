import { EyeIcon, EyeOffIcon } from "lucide-react"

import {
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

type AuthenticationPasswordVisibilityButtonProps = {
  className?: string
  inputId: string
  isVisible: boolean
  label: string
  onVisibilityChange: (isVisible: boolean) => void
}

/** Toggles visibility for one authentication password control. */
export function AuthenticationPasswordVisibilityButton({
  className,
  inputId,
  isVisible,
  label,
  onVisibilityChange,
}: AuthenticationPasswordVisibilityButtonProps) {
  return (
    <InputGroupAddon align="inline-end" className={cn(className)}>
      <InputGroupButton
        aria-controls={inputId}
        aria-label={`${isVisible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        aria-pressed={isVisible}
        className="relative"
        onClick={() => onVisibilityChange(!isVisible)}
        size="icon-sm"
        type="button"
      >
        {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 size-12 -translate-1/2 pointer-fine:hidden"
        />
      </InputGroupButton>
    </InputGroupAddon>
  )
}
