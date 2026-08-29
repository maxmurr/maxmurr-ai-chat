export function buildGreeting(name: string): string {
  const recipient = name.trim() || "friend"
  return `Hello, ${recipient}!`
}
