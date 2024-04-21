import { PromptTemplate } from "@langchain/core/prompts";
import { OpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/community/llms/ollama";
import { LLMChain } from "langchain/chains";
import dotenv from "dotenv";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";
dotenv.config();

const urilocalai = process.env.URI_LANGCHAIN_LLMSTUDIO || 'http://eleanor:1234/v1'; // Usa il valore della variabile di ambiente PORT, se definita, altrimenti usa la porta 3000
const uriollama = process.env.URI_LANGCHAIN_OLLAMA || 'http://kali:1234'; // Usa il valore della variabile di ambiente PORT, se definita, altrimenti usa la porta 3000
const local_model_name = process.env.LOCAL_MODEL_NAME || "gpt-4-turbo";


const getAnswerLLM = async (config: ConfigChainPrompt) => {

    const llmChain = new LLMChain({

        llm: new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            temperature: config.temperature,
            modelName: config.modelname || local_model_name
        }),
        prompt: PromptTemplate.fromTemplate(" SYSTEM:" + config.systemprompt + " USER:" + config.question),
    });
    const answer = await llmChain.invoke({ topic: config.question });
    console.log("Risposta generata:", answer);
    return answer;
}

const getAnswerLocalLLM = async (config: ConfigChainPrompt) => {

    const llmChain = new LLMChain({

        llm: new OpenAI({
            configuration: {
                baseURL: urilocalai,
            },
            maxTokens: config.maxTokens,
            temperature: config.temperature,
            modelName: config.modelname || local_model_name,
        }),
        prompt: PromptTemplate.fromTemplate(" SYSTEM:" + config.systemprompt + " USER:" + config.question),
    });
    const answer = await llmChain.invoke({ topic: config.question }, { metadata: {} });
    console.log("Risposta generata:", answer);
    return answer;
}

const getAnswerOllamaLLM = async (config: ConfigChainPrompt) => {

    const llmChain = new LLMChain({
        llm: new Ollama({
            baseUrl: uriollama,
            temperature: config.temperature,
            model: config.modelname || local_model_name,
            numCtx: config.numCtx,

            //XXX: parametri da capire e sperimentare
            keepAlive: "24h",
            logitsAll: true,
        }),
        prompt: PromptTemplate.fromTemplate(" SYSTEM:" + config.systemprompt + " USER:" + config.question),
    });
    const answer = await llmChain.invoke({ topic: config.question });
    console.log("Risposta generata:", answer);
    return answer;
}


export { getAnswerLLM, getAnswerLocalLLM, getAnswerOllamaLLM };