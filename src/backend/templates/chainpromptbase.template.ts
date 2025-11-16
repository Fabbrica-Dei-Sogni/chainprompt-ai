import { SystemMessageFields, HumanMessageFields } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

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

/**
 * Interfaccia che rappresenta il template prompt base dell'applicazione in cui si esplicitano il system e user prompt.
 * 
 * Potrebbero essere definiti template che ad esempio prevedano dei dati dinamici in input da processare in una catena di prompt tali da rappresentarne un flusso simile a quanto si puo progettare con lo strumento rivet
 * 
 @deprecated
 */
export interface ChainPromptBaseTemplate {
  systemPrompt: SystemMessageFields;
  question: HumanMessageFields;
}

/**
Template non piu utilizzato, ma potrebbe essere l'ispirazione per futuri template
 * @deprecated
 */
const CHAT_PROMPT = ChatPromptTemplate.fromTemplate("{systemprompt}\n\n{question}");



