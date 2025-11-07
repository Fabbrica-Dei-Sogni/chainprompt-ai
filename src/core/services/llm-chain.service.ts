import { OpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/ollama";

import dotenv from "dotenv";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";
import { ChainPromptBaseTemplate } from "../interfaces/chainpromptbasetemplate.js";
import { Runnable } from "@langchain/core/runnables";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { Tool } from "@langchain/core/tools";
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

const chatprompt = ChatPromptTemplate.fromTemplate("{systemprompt}\n\n{question}");

export const getCloudLLM = (config: ConfigChainPrompt) => {

    const llm = new ChatOpenAI({
        maxTokens: config.maxTokens,
        apiKey: process.env.OPENAI_API_KEY,
        temperature: config.temperature,
        modelName: config.modelname || process.env.LOCAL_MODEL_NAME
    }) as unknown as Runnable;
    
    const llmChain = chatprompt.pipe(llm);

    return llmChain;

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
    
    const llmChain = chatprompt.pipe(llm);

    return llmChain;

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
    const llmChain = chatprompt.pipe(llm);
    //console.info("Ollama LLM Chain created:", llmChain);
    return llmChain;

};

export const invokeChain = async (llm : Runnable, prompt: ChainPromptBaseTemplate) =>
{ 
    //console.info("Invoking chain with prompt:", prompt);
    const answer = await llm.invoke({
        systemprompt: prompt.systemprompt,
        question: prompt.question,
    });
    //console.info("Chain invoked, answer:", answer);
    return answer;
}



/**
 * Metodo preposto all'invio di un prompt ad un llm fornito di tool strutturati.
 Flusso implementativo il piu possibile aderente alle best practise
 
 * @param llm 
 * @param prompt 
 * @param tools 
 * @returns 
 */
export const invokeWithTools = async (
  llm: Runnable,
  prompt: ChainPromptBaseTemplate,
  tools: Tool[] = [] // Parametro opzionale per tool tematici, caricato dal folder
): Promise<AIMessage> => {
  // Inizializza thread con messaggi BaseMessage per compatibilità LCEL
  let messages: BaseMessage[] = [
    new SystemMessage(prompt.systemprompt!), // System prompt arricchito dal file tematico
    new HumanMessage(prompt.question!)       // Query utente
  ];
  // Prima invocazione: genera AIMessage (con o senza tool_calls)
  let response: AIMessage = await llm.invoke(messages) as AIMessage;
  // Loop asincrono per tool calling: continua finché ci sono tool da eseguire
  while (response.tool_calls && response.tool_calls.length > 0) {
    for (const toolCall of response.tool_calls) {
      const tool = tools.find(t => t.name === toolCall.name);
      if (tool) {
        try {
          // Esegui tool asincrono con args validati (da Zod schema)
          const toolResult = await tool.invoke(toolCall.args);
          // Aggiungi AIMessage attuale e ToolMessage al thread per contesto
          messages.push(response);
          messages.push(new ToolMessage(toolResult.toString(), toolCall.id!));
        } catch (error : unknown) {
          // Fallback elegante: continua senza bloccare, logga per debug
            console.error(`Errore tool ${toolCall.name}:`, error);
            const message = error instanceof Error ? error.message : String(error);
            messages.push(new ToolMessage(`Errore nell'esecuzione del tool: ${message}`, toolCall.id!));
        }
      } else {
        // Tool non trovato: ignora per semplicità, o logga warning
        console.warn(`Tool non trovato: ${toolCall.name}`);
      }
    }
    // Ri-invoca con thread aggiornato per next reasoning
    response = await llm.invoke(messages) as AIMessage;
    
    // Opzionale: limite iterazioni per prevenire loop infiniti (best practice)
    // if (messages.length > 10) throw new Error('Max iterazioni tool raggiunte');
  }
  // Ritorna AIMessage finale (sempre .content popolato)
  return response;
};