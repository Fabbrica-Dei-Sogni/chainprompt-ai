import dotenv from "dotenv";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";
import { generateCloudLLMWithSystemuserBasicPrompt, generateLocalLLMWithSystemuserBasicPrompt, generateOllamaLLMWithSystemuserBasicPrompt, generateOllamaByRAG } from "../middlewarellm/systemuserbasicprompt.js";
import { ChainPromptBaseTemplate } from "../interfaces/chainpromptbasetemplate.js";
dotenv.config();


const getAnswerLLM = async (config: ConfigChainPrompt, prompt: ChainPromptBaseTemplate) => {
    return await generateCloudLLMWithSystemuserBasicPrompt(config, prompt);
}

const getAnswerLocalLLM = async (config: ConfigChainPrompt, prompt: ChainPromptBaseTemplate) => {
    return await generateLocalLLMWithSystemuserBasicPrompt(config, prompt);
}

const getAnswerOllamaLLM = async (config: ConfigChainPrompt, prompt: ChainPromptBaseTemplate) => {
    return await generateOllamaLLMWithSystemuserBasicPrompt(config, prompt);
}

/**
 * Metodo per ottenere una risposta attraverso una interrogazione RAG oriented
 * @deprecated
 * @param context 
 * @param config 
 * @param prompt 
 * @returns 
 */
const getAnswerRAGOllamaLLM = async (context: string, config: ConfigChainPrompt, prompt: ChainPromptBaseTemplate) => {
    return await generateOllamaByRAG(context, config, prompt);
}


export { getAnswerLLM, getAnswerLocalLLM, getAnswerOllamaLLM };