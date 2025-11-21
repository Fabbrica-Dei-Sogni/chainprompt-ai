import "reflect-metadata";
import { container, type InjectionToken } from "tsyringe";

export const coreContainer = container;

// registra un singleton generico
export function registerSingleton<T>(
  token: InjectionToken<T>,
  useClass: InjectionToken<T>
) {
  coreContainer.registerSingleton<T>(token, useClass);
}

// registra un valore pre–costruito (es. logger)
export function registerValue<T>(token: InjectionToken<T>, value: T) {
  coreContainer.registerInstance<T>(token, value);
}

// risoluzione generica
export function get<T>(token: InjectionToken<T>): T {
  return coreContainer.resolve<T>(token);
}
