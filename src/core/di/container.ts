import { Logger } from "winston";
import { logger } from "../logger.core.js";
import { coreContainer, get, registerValue } from "./common.container.js";
import { InjectionToken } from "tsyringe";
import { LOGGER_TOKEN } from "./tokens.js";

/**
 * DI Container Setup
 * 
 * This module configures dependency injection for the application.
 * We use manual registration (Approach 2) to avoid decorators.
 * 
 * Currently injected:
 * - Logger (Winston instance)
 * 
 * Future: Can extend to inject other services if needed
 */

// registrazione del logger come valore usando token centralizzato
registerValue<Logger>(LOGGER_TOKEN, logger);


// nuova funzione generica
export function getComponent<T>(token: InjectionToken<T>): T {
  return coreContainer.resolve<T>(token);
}

/**
@deprecated
 * Type-safe helper to resolve logger from container

 metodo a titolo documentativo
 * 
 * @returns Logger instance
 */
function getLogger(): Logger {
  return get<Logger>(LOGGER_TOKEN);
}
/**
 * Export container for testing purposes
 * Allows tests to register mock instances
 */
export { coreContainer as container };
