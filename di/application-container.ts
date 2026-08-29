import { createContainer } from "@evyweb/ioctopus"

import type { ApplicationDependencyRegistry } from "@/di/application-container.registry"
import { createChatModule } from "@/di/modules/chat.module"
import { createLibraryModule } from "@/di/modules/library.module"
import { createMonitoringModule } from "@/di/modules/monitoring.module"

const applicationContainer = createContainer<ApplicationDependencyRegistry>()

applicationContainer.load("MonitoringModule", createMonitoringModule())
applicationContainer.load("LibraryModule", createLibraryModule())
applicationContainer.load("ChatModule", createChatModule())

/** Resolves one type-safe dependency from production Ioctopus container. */
export const resolveApplicationDependency = applicationContainer.get
