import { HumanMessageFields, SystemMessageFields } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder, PromptTemplate } from "@langchain/core/prompts";
import { LLMProvider } from "../models/llmprovider.enum.js";
import { DataRequest } from "./datarequest.js";

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

export async function getFormattedSystemPrompt(context : string, provider : LLMProvider,modelname : string , systemPrompt: string) { 

  const result = await promptTemplate.format({
  context,
  provider,
  modelname,
  basePrompt: systemPrompt // oppure il prompt generato dinamicamente
});
  
  return result;

}


const systemPromptTemplate = `
Sei un agente tematico incaricato di gestire il contesto "{context}" usando il provider "{provider}" e il modelname "{modelname}".
Tutte le risposte devono attenersi alle policy definite per questo dominio.

{basePrompt}
`.trim();

const promptTemplate = new PromptTemplate({
  template: systemPromptTemplate,
  inputVariables: ["context", "provider", "modelname", "basePrompt"]
});

export async function getFormattedSystemPromptAdvanced(systemPrompt: string, resultData: DataRequest, includeJson = true) { 

  const promptVars = buildSystemPrompt(resultData, systemPrompt, includeJson);

  const result = await promptTemplateAdvanced.format(promptVars);
  
  return result;

}

const systemPromptTemplateAdvanced = `
Sei un agente tematico incaricato di gestire la seguente richiesta.
Dati principali della conversazione:
- Chiave conversazione: {keyconversation}
- Modello LLM: {modelname}
- Temperatura: {temperature}
- Max tokens: {maxTokens}
- numCtx: {numCtx}

# Se e solo se il tool lo richiede, includi TUTTI questi dati serializzati in JSON: #
{dataRequestJson}

Istruzioni:
- Usa SEMPRE questi dati per ragionare o generare risposte.
- Se chiami un tool che richiede argomenti di configurazione, ALLEGA il JSON completo di sopra come input.
- Altrimenti, non includere il JSON nella risposta.


{basePrompt}
`.trim();

const promptTemplateAdvanced = new PromptTemplate({
  template: systemPromptTemplateAdvanced,
  inputVariables: [
    "keyconversation", "modelname", "temperature", "maxTokens", "numCtx", "dataRequestJson", "basePrompt"
  ]
});

function buildSystemPrompt(dataRequest: DataRequest, systemPrompt: string, includeJson: boolean) {
  const {
    keyconversation,
    modelname = "",
    temperature = "",
    maxTokens = "",
    numCtx = ""
  } = dataRequest;

  // Serializzazione JSON, solo se richiesto
  const dataRequestJson = includeJson
    ? JSON.stringify(dataRequest, null, 2)
    : "";

  return {
    keyconversation,
    modelname,
    temperature,
    maxTokens,
    numCtx,
    dataRequestJson,
    basePrompt: systemPrompt
  };
}


/**
Template non piu utilizzato, ma potrebbe essere l'ispirazione per futuri template
 * @deprecated
 */
const CHAT_PROMPT = ChatPromptTemplate.fromTemplate("{systemprompt}\n\n{question}");



