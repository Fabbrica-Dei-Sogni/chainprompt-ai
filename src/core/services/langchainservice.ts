import { PromptTemplate } from "@langchain/core/prompts";
import { OpenAI } from "@langchain/openai";
import { LLMChain } from "langchain/chains";
import dotenv from "dotenv";
dotenv.config();

const urilocalai = process.env.URI_LOCALAI || 'http://eleanor:1234/v1/chat/completions'; // Usa il valore della variabile di ambiente PORT, se definita, altrimenti usa la porta 3000
const local_model_name = process.env.LOCAL_MODEL_NAME || "gpt-4-turbo";
// Dizionario che mappa gli indirizzi IP alle conversazioni
const conversations: Record<string, any> = {};
//const openai = new OpenAI(process.env.OPENAI_API_KEY);

const getAnswerLLM = async (systemprompt: string, question: string, temperature: number, modelName: string = local_model_name) => {

    const llmChain = new LLMChain({

        llm: new OpenAI({ apiKey: process.env.OPENAI_API_KEY, temperature, modelName }),
        prompt: PromptTemplate.fromTemplate(systemprompt),
    });
    const response = await llmChain.call(question);
    const answer = response.choices[0].message.content.trim();
    console.log("Risposta generata:", answer);
    return answer;
}

const getAnswerLocalLLM = async (systemprompt: string, question: string, temperature: number, modelName: string = local_model_name) => {

    const llmChain = new LLMChain({

        llm: new OpenAI({
            configuration: {
                baseURL: urilocalai,
            },
            temperature, modelName
        }),
        prompt: PromptTemplate.fromTemplate(systemprompt),
    });
    const answer = await llmChain.call(question);
    console.log("Risposta generata:", answer);
    return answer;
}


export { getAnswerLLM, getAnswerLocalLLM };