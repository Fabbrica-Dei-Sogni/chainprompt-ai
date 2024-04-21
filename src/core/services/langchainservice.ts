import dotenv from "dotenv";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";
import { callCloudLLMWithSystemuserBasicPrompt, callLocalLLMWithSystemuserBasicPrompt, callOllamaLLMWithSystemuserBasicPrompt } from "../middlewarellm/systemuserbasicprompt.js";
dotenv.config();


const getAnswerLLM = async (config: ConfigChainPrompt) => {
    return await callCloudLLMWithSystemuserBasicPrompt(config);
}

const getAnswerLocalLLM = async (config: ConfigChainPrompt) => {
    return await callLocalLLMWithSystemuserBasicPrompt(config);
}

const getAnswerOllamaLLM = async (config: ConfigChainPrompt) => {
    return await callOllamaLLMWithSystemuserBasicPrompt(config);
}


export { getAnswerLLM, getAnswerLocalLLM, getAnswerOllamaLLM };