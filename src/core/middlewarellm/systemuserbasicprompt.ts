import { OpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";
import { Ollama } from "@langchain/ollama";
import { ChainPromptBaseTemplate } from "../interfaces/chainpromptbasetemplate.js";
import { retrieveAndAskPrompt } from "./ragtier/documentretrieves.js";
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

export const generateCloudLLMWithSystemuserBasicPrompt = async (config: ConfigChainPrompt, prompt: ChainPromptBaseTemplate) => {

    /*const completePrompt = new PromptTemplate({
        template: "{systemprompt}\n\n{question}",
        inputVariables: ["systemprompt", "question"],
    });*/
    const chatprompt = ChatPromptTemplate.fromTemplate("{systemprompt}\n\n{question}");
    const llm = new ChatOpenAI({
        configuration: {
            baseURL: process.env.URI_LANGCHAIN_LLMSTUDIO,
        },
        maxTokens: config.maxTokens,
        apiKey: process.env.OPENAI_API_KEY,
        temperature: config.temperature,
        modelName: config.modelname || process.env.LOCAL_MODEL_NAME
    });
    const llmChain = chatprompt.pipe(llm);

    /*const llmChain = new LLMChain({

        llm: new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            temperature: config.temperature,
            modelName: config.modelname || process.env.LOCAL_MODEL_NAME
        }),
        prompt: completePrompt,
    });*/

    const answer = await llmChain.invoke({
        systemprompt: prompt.systemprompt,
        question: prompt.question,
    });
    return answer;

};

export const generateLocalLLMWithSystemuserBasicPrompt = async (config: ConfigChainPrompt, prompt: ChainPromptBaseTemplate) => {

    /*const completePrompt = new PromptTemplate({
        template: "{systemprompt}\n\n{question}",
        inputVariables: ["systemprompt", "question"],
    });*/
    const chatprompt = ChatPromptTemplate.fromTemplate("{systemprompt}\n\n{question}");
    const llm = new ChatOpenAI({
        configuration: {
            baseURL: process.env.URI_LANGCHAIN_LLMSTUDIO,
        },
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        modelName: config.modelname || process.env.LOCAL_MODEL_NAME
    });
    const llmChain = chatprompt.pipe(llm);

    /*const llmChain = new LLMChain({

        llm: new OpenAI({
            configuration: {
                baseURL: process.env.URI_LANGCHAIN_LLMSTUDIO,
            },
            maxTokens: config.maxTokens,
            temperature: config.temperature,
            modelName: config.modelname || process.env.LOCAL_MODEL_NAME
        }),
        prompt: completePrompt,
    });*/
    const answer = await llmChain.invoke({
        systemprompt: prompt.systemprompt,
        question: prompt.question,
    });
    return answer;

};

export const generateOllamaLLMWithSystemuserBasicPrompt = async (config: ConfigChainPrompt, prompt: ChainPromptBaseTemplate) => {

    /*const completePrompt = new PromptTemplate({
        template: "{systemprompt}\n\n{question}",
        inputVariables: ["systemprompt", "question"],
    });*/

    /*const llmChain = new LLMChain({

        llm: new Ollama({
            baseUrl: process.env.URI_LANGCHAIN_OLLAMA,
            temperature: config.temperature,
            model: config.modelname || process.env.LOCAL_MODEL_NAME,
            numCtx: config.numCtx,

            //XXX: parametri da capire e sperimentare
            keepAlive: "24h",
            logitsAll: true,
        }),
        prompt: completePrompt,

    });*/

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
    const chatprompt = ChatPromptTemplate.fromTemplate("{systemprompt}\n\n{question}");
    const llmChain = chatprompt.pipe(llm);

    const answer = await llmChain.invoke({
        systemprompt: prompt.systemprompt,
        question: prompt.question,
    });
    return answer;

};

/**
 * Metodo per generare la risposta a partire da un retrieve RAG
 * @param context 
 * @param config 
 * @param prompt 
 * @returns
 * @deprecated
  */
export const generateOllamaByRAG = async (context: string, config: ConfigChainPrompt, prompt: ChainPromptBaseTemplate) => {

    let answer = await retrieveAndAskPrompt(context, config, prompt);
    console.log("Risposta generata:", answer);
    return answer;
}

