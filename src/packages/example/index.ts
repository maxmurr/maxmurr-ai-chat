import { buildGreeting } from "./lib/impl"

export function greet(name: string): string {
  return buildGreeting(name)
}
