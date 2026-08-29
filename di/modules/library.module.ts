import { createModule } from "@evyweb/ioctopus"

import {
  applicationInjectionTokens,
  type ApplicationDependencyRegistry,
} from "@/di/application-container.registry"
import { drizzleLibraryRepository } from "@/src/infrastructure/repositories/drizzle-library.repository"
import { createLibraryController } from "@/src/interface-adapters/controllers/library/library.controller"

/** Registers Library persistence and owner-scoped controller. */
export function createLibraryModule() {
  const libraryModule = createModule<ApplicationDependencyRegistry>()

  libraryModule
    .bind(applicationInjectionTokens.libraryRepository)
    .toValue(drizzleLibraryRepository)
  libraryModule
    .bind(applicationInjectionTokens.libraryController)
    .toFactory((resolve) =>
      createLibraryController(
        resolve(applicationInjectionTokens.libraryRepository)
      )
    )

  return libraryModule
}
