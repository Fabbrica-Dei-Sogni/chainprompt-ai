import dotenv from "dotenv";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";
import { generateCloudLLMWithSystemuserBasicPrompt, generateLocalLLMWithSystemuserBasicPrompt, generateOllamaLLMWithSystemuserBasicPrompt } from "../middlewarellm/systemuserbasicprompt.js";
dotenv.config();


const getAnswerLLM = async (config: ConfigChainPrompt) => {
    return await generateCloudLLMWithSystemuserBasicPrompt(config);
}

const getAnswerLocalLLM = async (config: ConfigChainPrompt) => {
    return await generateLocalLLMWithSystemuserBasicPrompt(config);
}

const getAnswerOllamaLLM = async (config: ConfigChainPrompt) => {
    return await generateOllamaLLMWithSystemuserBasicPrompt(config);
}


export { getAnswerLLM, getAnswerLocalLLM, getAnswerOllamaLLM };