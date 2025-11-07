import { LLMProvider } from "../models/llmprovider.enum.js";

export const providerRoutes = [
  { prefix: 'localai', provider: LLMProvider.OpenAILocal },
  { prefix: 'cloud', provider: LLMProvider.OpenAICloud },
  { prefix: 'ollama', provider: LLMProvider.Ollama }
];