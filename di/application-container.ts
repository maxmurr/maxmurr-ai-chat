import { createContainer } from "@evyweb/ioctopus"

import type { ApplicationDependencyRegistry } from "@/di/application-container.registry"
import { createChatModule } from "@/di/modules/chat.module"

const applicationContainer = createContainer<ApplicationDependencyRegistry>()

applicationContainer.load("ChatModule", createChatModule())

/** Resolves one type-safe dependency from production Ioctopus container. */
export const resolveApplicationDependency = applicationContainer.get
