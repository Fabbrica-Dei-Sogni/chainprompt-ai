import { ChainPromptBaseTemplate } from '../interfaces/chainpromptbasetemplate.js';
import { ConfigChainPrompt } from '../interfaces/configchainprompt.js';
import { getCloudLLM, getLocalLLM, getOllamaLLM, invokeChain } from './langchain.service.js'

export const getAnswerLLM = async (config: ConfigChainPrompt, prompt: ChainPromptBaseTemplate) => {

    const llmChain = getCloudLLM(config);

    const answer = await invokeChain(llmChain, prompt);

    return answer;

};

export const getAnswerLocalLLM = async (config: ConfigChainPrompt, prompt: ChainPromptBaseTemplate) => {

    const llmChain = getLocalLLM(config);

    const answer = await invokeChain(llmChain, prompt);

    return answer;

};

export const getAnswerOllamaLLM = async (config: ConfigChainPrompt, prompt: ChainPromptBaseTemplate) => {

    const llmChain = getOllamaLLM(config);//chatprompt.pipe(llm);

    const answer = await invokeChain(llmChain, prompt);

    return answer;

};