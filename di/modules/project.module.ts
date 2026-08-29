import { createModule } from "@evyweb/ioctopus";

import {
  applicationInjectionTokens,
  type ApplicationDependencyRegistry,
} from "@/di/application-container.registry";
import { drizzleProjectRepository } from "@/src/infrastructure/repositories/drizzle-project.repository";
import { createProjectController } from "@/src/interface-adapters/controllers/project/project.controller";

/** Registers Project persistence and owner-scoped controller. */
export function createProjectModule() {
  const projectModule = createModule<ApplicationDependencyRegistry>();

  projectModule
    .bind(applicationInjectionTokens.projectRepository)
    .toValue(drizzleProjectRepository);
  projectModule
    .bind(applicationInjectionTokens.projectController)
    .toHigherOrderFunction(createProjectController, [
      applicationInjectionTokens.projectRepository,
      applicationInjectionTokens.chatRepository,
      applicationInjectionTokens.libraryController,
    ]);

  return projectModule;
}
