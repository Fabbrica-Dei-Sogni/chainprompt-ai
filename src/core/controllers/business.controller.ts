
/**
 * Business controller per fornire gli accessi ai modelli llm supportati.
 */
import { senderToLLM } from '../services/llm-middleware.service.js'
import { DataRequest } from "../interfaces/datarequest.js";
import { LLMProvider } from '../models/llmprovider.enum.js';

/**
 * Metodo per inviare un prompt ad un llm e ricevere una risposta in modo sincrono.
    E' studiato per essere interrogato da un endpoint rest classico
 * @param provider 
 * @param inputData 
 * @param systemPrompt 
 * @returns 
 */
export async function getAnswerByPrompt(
  provider: LLMProvider,
  inputData: DataRequest,
  systemPrompt: string
) {
    
  switch (provider) {
    case LLMProvider.OpenAICloud:
    case LLMProvider.OpenAILocal:
    case LLMProvider.Ollama:
      return await senderToLLM(inputData, systemPrompt, provider);
    default:
      throw new Error(`Provider non supportato: ${provider}`);
  }
}