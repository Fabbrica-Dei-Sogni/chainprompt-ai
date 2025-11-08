import { OpenAI } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/ollama";

import dotenv from "dotenv";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";
import { ChainPromptBaseTemplate, CHAT_PROMPT } from "../interfaces/chainpromptbasetemplate.js";
import { Runnable } from "@langchain/core/runnables";
import { LLMProvider } from "../models/llmprovider.enum.js";

dotenv.config();

/*
 * La seguente implementazione raccoglie metodi per interrogare modelli LLM con la libreria Langchain configurandone i parametri peculiari di ciascun modello usato processandone il prompt seguendo il pattern base:
 * systemprompt e userprompt.
 * 
 * Ha lo scopo di fornire uno standard di richiesta e ritorno risposta da un modello llm delegando all'applicazione il modo con cui il system e l'user prompt vengono costruiti.
 * La response di questi metodi generano un prompt di tipo assistant il quale puo essere o un output finale di una chatbot oppure l'input di una nuova catena di prompt.
 * 
 * Implementazioni simili potranno essere sviluppati usando template prompt diversi con relativo tier di servizi dedicati in base all'obiettivo richiesto.
 * 
 * L'obiettivo di questa implementazione è fornire accurati prompt separando in modo netto il system e l'user prompt, focalizzando la configurazione dei modelli.
 */

export const invokeChain = async (llm: Runnable, prompt: ChainPromptBaseTemplate) => {

  const llmChain = CHAT_PROMPT.pipe(llm);
  const answer = await llmChain.invoke({ systemprompt: prompt.systemprompt, question: prompt.question });
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


const getCloudLLM = (config: ConfigChainPrompt) => {

  const llm = new ChatOpenAI({
    maxTokens: config.maxTokens,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: config.temperature,
    modelName: config.modelname || process.env.LOCAL_MODEL_NAME
  }) as unknown as Runnable;

  return llm;

};


const getLocalLLM = (config: ConfigChainPrompt) => {

  const llm = new ChatOpenAI({
    configuration: {
      baseURL: process.env.URI_LANGCHAIN_LLMSTUDIO,
    },
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    modelName: config.modelname || process.env.LOCAL_MODEL_NAME
  }) as unknown as Runnable;

  return llm;

};

const getOllamaLLM = (config: ConfigChainPrompt) => {

  const llm = new Ollama({
    baseUrl: process.env.URI_LANGCHAIN_OLLAMA,
    temperature: config.temperature,
    model: config.modelname || process.env.LOCAL_MODEL_NAME,
    numCtx: config.numCtx,
    //XXX candidati nuovi parametri: saranno eventualmente messi a configurazione
    //numBatch: 512,
    //topK: 40,
    //repeatPenalty: 1.1,
    //topP: 0.95,

    //XXX: parametri da capire e sperimentare
    //keepAlive: "24h",
    //logitsAll: true,
  })
  return llm;

};
