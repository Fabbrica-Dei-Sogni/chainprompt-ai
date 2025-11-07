import { OpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/ollama";

import dotenv from "dotenv";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";
import { ChainPromptBaseTemplate } from "../interfaces/chainpromptbasetemplate.js";
import { Runnable } from "@langchain/core/runnables";
import { BaseMessage, HumanMessage, HumanMessageFields, SystemMessage, SystemMessageFields } from "@langchain/core/messages";

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


//XXX: prima versione di template chatprompt
//const chatprompt = ChatPromptTemplate.fromTemplate("{systemprompt}\n\n{question}");

//logiche per costruire un systemmessage strutturato
function toSystemMessage(systemprompt: SystemMessageFields): SystemMessage {
  if (typeof systemprompt === "string") {
    return new SystemMessage(systemprompt);
  }
  // Se content è un array o struttura complessa, estrai solo la parte testuale principale
  if (typeof systemprompt.content === "string") {
    return new SystemMessage(systemprompt.content);
  }
  if (Array.isArray(systemprompt.content)) {
    // Ad esempio concatena i blocchi di testo in stringa semplice
    const combinedContent = systemprompt.content
      .map(block => typeof block === "string" ? block : JSON.stringify(block))
      .join("\n");
    return new SystemMessage(combinedContent);
  }

  // Fallback: serializza tutto in stringa
  return new SystemMessage(JSON.stringify(systemprompt.content));
}

function toHumanMessage(question: HumanMessageFields): HumanMessage {
  if (typeof question === "string") {
    return new HumanMessage(question);
  }
  if (typeof question.content === "string") {
    return new HumanMessage(question.content);
  }
  if (Array.isArray(question.content)) {
    const combinedContent = question.content
      .map(block => typeof block === "string" ? block : JSON.stringify(block))
      .join("\n");
    return new HumanMessage(combinedContent);
  }
  return new HumanMessage(JSON.stringify(question.content));
}

// Conversione in array BaseMessage
function toBaseMessages(prompt: ChainPromptBaseTemplate): BaseMessage[] {
  return [toSystemMessage(prompt.systemprompt), toHumanMessage(prompt.question)];
}


export const getCloudLLM = (config: ConfigChainPrompt) => {

    const llm = new ChatOpenAI({
        maxTokens: config.maxTokens,
        apiKey: process.env.OPENAI_API_KEY,
        temperature: config.temperature,
        modelName: config.modelname || process.env.LOCAL_MODEL_NAME
    }) as unknown as Runnable;
    
    //const llmChain = chatprompt.pipe(llm);

    return llm;

};


export const getLocalLLM = (config: ConfigChainPrompt) => {

    const llm = new ChatOpenAI({
        configuration: {
            baseURL: process.env.URI_LANGCHAIN_LLMSTUDIO,
        },
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        modelName: config.modelname || process.env.LOCAL_MODEL_NAME
    })as unknown as Runnable;
    
    //const llmChain = chatprompt.pipe(llm);

    return llm;

};

export const getOllamaLLM = (config: ConfigChainPrompt) => {

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
        keepAlive: "24h",
        logitsAll: true,
    })
    //const llmChain = chatprompt.pipe(llm);
    //console.info("Ollama LLM Chain created:", llmChain);
    return llm;

};


export const invokeChain = async (llm : Runnable, prompt: ChainPromptBaseTemplate) =>
{ 
  //console.info("Invoking chain with prompt:", prompt);
    const messages = toBaseMessages(prompt);
    const answer = await llm.invoke(messages);
    //console.info("Chain invoked, answer:", answer);
    return answer;
}