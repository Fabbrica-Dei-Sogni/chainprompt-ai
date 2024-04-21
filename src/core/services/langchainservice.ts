import { PromptTemplate } from "@langchain/core/prompts";
import { OpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/community/llms/ollama";
import { LLMChain } from "langchain/chains";
import dotenv from "dotenv";
dotenv.config();

const urilocalai = process.env.URI_LANGCHAIN_LLMSTUDIO || 'http://eleanor:1234/v1'; // Usa il valore della variabile di ambiente PORT, se definita, altrimenti usa la porta 3000
const uriollama = process.env.URI_LANGCHAIN_OLLAMA || 'http://kali:1234'; // Usa il valore della variabile di ambiente PORT, se definita, altrimenti usa la porta 3000

const local_model_name = process.env.LOCAL_MODEL_NAME || "gpt-4-turbo";
// Dizionario che mappa gli indirizzi IP alle conversazioni
const conversations: Record<string, any> = {};
//const openai = new OpenAI(process.env.OPENAI_API_KEY);

const getAnswerLLM = async (systemprompt: string, question: string, temperature: number, modelName: string = local_model_name) => {

    const llmChain = new LLMChain({

        llm: new OpenAI({ apiKey: process.env.OPENAI_API_KEY, temperature, modelName }),
        prompt: PromptTemplate.fromTemplate(systemprompt + " " + question),
    });
    const answer = await llmChain.invoke({ topic: question });
    console.log("Risposta generata:", answer);
    return answer;
}

const getAnswerLocalLLM = async (systemprompt: string, question: string, temperature: number, modelName: string = local_model_name) => {

    const llmChain = new LLMChain({

        llm: new OpenAI({
            configuration: {
                baseURL: urilocalai,
            },
            temperature, modelName,
        }),
        prompt: PromptTemplate.fromTemplate(systemprompt + " " + question),
    });
    const answer = await llmChain.invoke({ topic: question });
    console.log("Risposta generata:", answer);
    return answer;
}

const getAnswerOllamaLLM = async (systemprompt: string, question: string, temperature: number, modelName: string = local_model_name) => {

    const llmChain = new LLMChain({
        llm: new Ollama({
            baseUrl: uriollama,
            temperature,
            model: modelName,
            numCtx: 8032,
            keepAlive: "24h",
        }),
        prompt: PromptTemplate.fromTemplate(systemprompt + " " + question),
    });
    const answer = await llmChain.invoke({ topic: question });
    console.log("Risposta generata:", answer);
    return answer;
}


export { getAnswerLLM, getAnswerLocalLLM, getAnswerOllamaLLM };