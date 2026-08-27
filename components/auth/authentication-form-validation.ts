const AUTHENTICATION_USERNAME_PATTERN = /^[A-Za-z0-9_.]+$/
const AUTHENTICATION_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const AUTHENTICATION_OTP_PATTERN = /^\d{6}$/

/** Returns first text validation error reported by authentication forms. */
export function getAuthenticationFieldError(errors: unknown[]) {
  return errors.find((error): error is string => typeof error === "string")
}

/** Validates account username syntax during email OTP registration. */
export function validateAuthenticationUsername(username: string) {
  const normalizedUsername = username.trim()

  if (!normalizedUsername) {
    return "Enter your username."
  }

  if (
    normalizedUsername.length < 3 ||
    normalizedUsername.length > 31 ||
    !AUTHENTICATION_USERNAME_PATTERN.test(normalizedUsername)
  ) {
    return "Use 3–31 letters, numbers, underscores, or periods."
  }

  return undefined
}

/** Validates email syntax before requesting an authentication code. */
export function validateAuthenticationEmail(email: string) {
  const normalizedEmail = email.trim()

  if (
    !normalizedEmail ||
    normalizedEmail.length > 320 ||
    !AUTHENTICATION_EMAIL_PATTERN.test(normalizedEmail)
  ) {
    return "Enter a valid email address."
  }

  return undefined
}

/** Validates six-digit Better Auth email one-time password codes. */
export function validateAuthenticationOtp(otp: string) {
  if (!AUTHENTICATION_OTP_PATTERN.test(otp)) {
    return "Enter the 6-digit code."
  }

  return undefined
}

/** Masks authentication email local-part while keeping recipient recognizable. */
export function maskAuthenticationEmail(email: string) {
  const atIndex = email.lastIndexOf("@")

  if (atIndex <= 0) {
    return email
  }

  return `${email[0]}***${email.slice(atIndex)}`
}
