import "reflect-metadata";
import { container } from "tsyringe";
import { Logger } from "winston";
import { logger } from "../logger.core.js";

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

// Register logger as singleton
container.register<Logger>("Logger", {
  useValue: logger,
});

/**
 * Type-safe helper to resolve logger from container
 * 
 * @returns Logger instance
 */
export function getLogger(): Logger {
  return container.resolve<Logger>("Logger");
}

/**
 * Export container for testing purposes
 * Allows tests to register mock instances
 */
export { container };
