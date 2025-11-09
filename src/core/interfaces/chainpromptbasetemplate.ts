import { HumanMessageFields, SystemMessageFields } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

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
 * @deprecated
 */
const CHAT_PROMPT = ChatPromptTemplate.fromTemplate("{systemprompt}\n\n{question}");

export function getPromptTemplate(systemPrompt: string) {

  const result = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new MessagesPlaceholder("input"),
    new MessagesPlaceholder("history"),
  ]);
  return result;
}
