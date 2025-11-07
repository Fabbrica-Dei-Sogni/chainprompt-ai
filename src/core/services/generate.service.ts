import { ChainPromptBaseTemplate } from '../interfaces/chainpromptbasetemplate.js';
import { ConfigChainPrompt } from '../interfaces/configchainprompt.js';
import { LLMProvider } from '../models/llmprovider.enum.js';
import { getCloudLLM, getLocalLLM, getOllamaLLM, invokeChain } from './langchain.service.js'

export const getAnswerLLMByProvider = async (
  provider: LLMProvider,
  config: ConfigChainPrompt,
  prompt: ChainPromptBaseTemplate
) => {
  let llmChain;

  switch (provider) {
    case LLMProvider.OpenAICloud:
      llmChain = getCloudLLM(config);
      break;
    case LLMProvider.OpenAILocal:
      llmChain = getLocalLLM(config);
      break;
    case LLMProvider.Ollama:
      llmChain = getOllamaLLM(config);
      break;
    default:
      throw new Error(`Provider non supportato: ${provider}`);
  }

  const answer = await invokeChain(llmChain, prompt);

  return answer;
};