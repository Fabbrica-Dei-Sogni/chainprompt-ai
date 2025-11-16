export enum LLMProvider {
  OpenAICloud = "openaicloud",
  OpenAILocal = "openailocal",
  Ollama = "ollama",
  ChatOllama = "chatollama",
  AzureOpenAiCloud = "azurecloud",
  Anthropic = "anthropic",
  Google = "google",

}

export const providerRoutes = [
  { prefix: 'localai', provider: LLMProvider.OpenAILocal },
  { prefix: 'cloud', provider: LLMProvider.OpenAICloud },
  { prefix: 'ollama', provider: LLMProvider.Ollama },
  { prefix: 'chatollama', provider: LLMProvider.ChatOllama },
  { prefix: 'anthropic', provider: LLMProvider.Anthropic },
  { prefix: 'google', provider: LLMProvider.Google },
];