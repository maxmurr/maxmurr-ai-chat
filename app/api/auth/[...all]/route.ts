import { toNextJsHandler } from "better-auth/next-js"

import { auth } from "@/di/authentication"

export const { GET, POST } = toNextJsHandler(auth)
