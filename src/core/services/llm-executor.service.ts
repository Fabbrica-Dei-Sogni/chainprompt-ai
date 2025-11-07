import { Runnable } from '@langchain/core/runnables';
import { ChainPromptBaseTemplate } from '../interfaces/chainpromptbasetemplate.js';
import { ConfigChainPrompt } from '../interfaces/configchainprompt.js';
import { LLMProvider } from '../models/llmprovider.enum.js';
import { getCloudLLM, getLocalLLM, getOllamaLLM, invokeChain } from './llm-chain.service.js'

export const getAnswerByProvider = async (
  provider: LLMProvider,
  config: ConfigChainPrompt,
  prompt: ChainPromptBaseTemplate
) => {
  let llmChain = getInstanceLLM(provider, config);

  return await submitPrompt(llmChain, prompt);
};

export async function submitPrompt(llmChain: Runnable, config: ChainPromptBaseTemplate) {
  
  const answer = await invokeChain(llmChain, config);

  return answer;
}

export function getInstanceLLM(provider: LLMProvider, config: ConfigChainPrompt) {
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
  return llmChain;
};
