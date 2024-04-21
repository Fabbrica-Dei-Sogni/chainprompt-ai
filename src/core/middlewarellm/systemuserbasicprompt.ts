import { PromptTemplate } from "@langchain/core/prompts";
import { OpenAI } from "@langchain/openai";
import { LLMChain } from "langchain/chains";
import dotenv from "dotenv";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";
import { Ollama } from "langchain/llms/ollama";
dotenv.config();

export const generateCloudLLMWithSystemuserBasicPrompt = async (config: ConfigChainPrompt) => {

    const completePrompt = new PromptTemplate({
        template: "SYSTEM:\n{systemprompt}\n\nUSER: {question}",
        inputVariables: ["systemprompt", "question"],
    });

    const llmChain = new LLMChain({

        llm: new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            temperature: config.temperature,
            modelName: config.modelname || process.env.LOCAL_MODEL_NAME || "gpt-4-turbo"
        }),
        prompt: completePrompt,
    });
    const answer = await llmChain.invoke({
        systemprompt: config.systemprompt,
        question: config.question,
    });
    console.log("Risposta generata:", answer);
    return answer;

};

export const generateLocalLLMWithSystemuserBasicPrompt = async (config: ConfigChainPrompt) => {

    const completePrompt = new PromptTemplate({
        template: "SYSTEM:\n{systemprompt}\n\nUSER: {question}",
        inputVariables: ["systemprompt", "question"],
    });

    const llmChain = new LLMChain({

        llm: new OpenAI({
            configuration: {
                baseURL: process.env.URI_LANGCHAIN_LLMSTUDIO || 'http://eleanor:1234/v1',
            },
            maxTokens: config.maxTokens,
            temperature: config.temperature,
            modelName: config.modelname || process.env.LOCAL_MODEL_NAME || "gpt-4-turbo"
        }),
        prompt: completePrompt,
    });
    const answer = await llmChain.invoke({
        systemprompt: config.systemprompt,
        question: config.question,
    });
    console.log("Risposta generata:", answer);
    return answer;

};

export const generateOllamaLLMWithSystemuserBasicPrompt = async (config: ConfigChainPrompt) => {

    const completePrompt = new PromptTemplate({
        template: "SYSTEM:\n{systemprompt}\n\nUSER: {question}",
        inputVariables: ["systemprompt", "question"],
    });

    const llmChain = new LLMChain({

        llm: new Ollama({
            baseUrl: process.env.URI_LANGCHAIN_OLLAMA || 'http://kali:1234',
            temperature: config.temperature,
            model: config.modelname || process.env.LOCAL_MODEL_NAME || "gpt-4-turbo",
            numCtx: config.numCtx,

            //XXX: parametri da capire e sperimentare
            keepAlive: "24h",
            logitsAll: true,
        }),
        prompt: completePrompt,
    });
    const answer = await llmChain.invoke({
        systemprompt: config.systemprompt,
        question: config.question,
    });
    console.log("Risposta generata:", answer);
    return answer;

};
