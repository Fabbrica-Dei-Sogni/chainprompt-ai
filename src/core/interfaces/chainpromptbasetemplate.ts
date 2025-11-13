import { HumanMessageFields, SystemMessageFields } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder, PromptTemplate } from "@langchain/core/prompts";
import { LLMProvider } from "../models/llmprovider.enum.js";
import { ConfigChainPrompt } from "./configchainprompt.js";

/**
 * Interfaccia che rappresenta il template prompt base dell'applicazione in cui si esplicitano il system e user prompt.
 * 
 * Potrebbero essere definiti template che ad esempio prevedano dei dati dinamici in input da processare in una catena di prompt tali da rappresentarne un flusso simile a quanto si puo progettare con lo strumento rivet
 * 
 */
export interface ChainPromptBaseTemplate {
  systemPrompt: SystemMessageFields;
  question: HumanMessageFields;
}

/**
 * Il prompt template utilizzato per memorizzare lo storico delle conversazioni.
   usato da redis.
 * @param systemPrompt 
 * @returns 
 */
export function getPromptTemplate(systemPrompt: string) {

  const result = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new MessagesPlaceholder("input"),
    new MessagesPlaceholder("history"),
  ]);
  return result;
};

export async function getFormattedSystemPrompt(context: string, provider: LLMProvider, config: ConfigChainPrompt, systemPrompt: string) {

  const result = await promptTemplate.format({
    context,
    provider,
    modelname: config.modelname,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    numCtx: config.numCtx,
    basePrompt: systemPrompt // oppure il prompt generato dinamicamente
  });

  return result;

}


const systemPromptTemplate = `
Sei un agente tematico incaricato di gestire il context "{context}" usando
provider "{provider}"
modelname "{modelname}"
temperature "{temperature}"
maxTokens "{maxTokens}"
numCtx "{numCtx}".

Tutte le risposte devono attenersi alle policy definite per questo dominio.

Il json da fornire in input ai tool che lo richiedono è fatto cosi
{{
  "config": {{
    "temperature": {temperature},
    "modelname": "{modelname}",
    "maxTokens": {maxTokens},
    "numCtx": {numCtx}
  }},
  "provider": "{provider}",
  "context": "{context}",
  "question": "la domanda da porre al tool"
}}

{basePrompt}
`.trim();

const promptTemplate = new PromptTemplate({
  template: systemPromptTemplate,
  inputVariables: ["context", "provider", "modelname", "temperature", "maxTokens", "numCtx", "basePrompt"]
});

/**
Template non piu utilizzato, ma potrebbe essere l'ispirazione per futuri template
 * @deprecated
 */
const CHAT_PROMPT = ChatPromptTemplate.fromTemplate("{systemprompt}\n\n{question}");



