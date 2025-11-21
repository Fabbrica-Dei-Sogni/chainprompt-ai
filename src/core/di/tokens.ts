import { InjectionToken } from "tsyringe";

/**
 * Centralized DI tokens to avoid stringly-typed tokens across the codebase.
 * Use these exported symbols as tokens for `@inject(...)` and for container registration.
 */
export const LOGGER_TOKEN: InjectionToken<any> = Symbol("Logger");
/*export const LLM_CHAIN_SERVICE_TOKEN: InjectionToken<any> = Symbol("LLMChainService");
export const LLM_EMBEDDINGS_SERVICE_TOKEN: InjectionToken<any> = Symbol("LLMEmbeddingsService");
export const LLM_AGENT_SERVICE_TOKEN: InjectionToken<any> = Symbol("LLMAgentService");
export const LLM_SENDER_SERVICE_TOKEN: InjectionToken<any> = Symbol("LLMSenderService");
export const CONVERTER_MODELS_TOKEN: InjectionToken<any> = Symbol("ConverterModels");
*/