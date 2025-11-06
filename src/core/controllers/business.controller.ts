
/**
 * Business controller per fornire gli accessi ai modelli llm supportati.
 */
import { getAnswerLLM, getAnswerLocalLLM, getAnswerOllamaLLM } from '../services/generate.service.js';
import { senderToLLM } from '../services/business.service.js'
import { DataRequest } from "../interfaces/datarequest.js";

export async function getAndSendPromptCloudLLM(inputData: DataRequest, systemPrompt: string) {
    //il contextchat è il tema del system prompt.
    //per ora non viene usato a questo livello, ma puo essere utile in futuro.
    return await senderToLLM(inputData, systemPrompt,  getAnswerLLM);
}

export async function getAndSendPromptLocalLLM(inputData: DataRequest, systemPrompt: string) {
    return await senderToLLM(inputData, systemPrompt,  getAnswerLocalLLM);
}

export async function getAndSendPromptbyOllamaLLM(inputData: DataRequest, systemPrompt: string) {
    return await senderToLLM(inputData, systemPrompt,  getAnswerOllamaLLM);
}