import { BaseMessage, HumanMessage, HumanMessageFields, SystemMessage, SystemMessageFields } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";

/**
 * Interfaccia che rappresenta il template prompt base dell'applicazione in cui si esplicitano il system e user prompt.
 * 
 * Potrebbero essere definiti template che ad esempio prevedano dei dati dinamici in input da processare in una catena di prompt tali da rappresentarne un flusso simile a quanto si puo progettare con lo strumento rivet
 * 
 */
export interface ChainPromptBaseTemplate {
  systemprompt: SystemMessageFields;
  question: HumanMessageFields;
}

export const CHAT_PROMPT = ChatPromptTemplate.fromTemplate("{systemprompt}\n\n{question}");

// Conversione in array BaseMessage
export function toBaseMessages(prompt: ChainPromptBaseTemplate): BaseMessage[] {
  return [toSystemMessage(prompt.systemprompt), toHumanMessage(prompt.question)];
}

//logiche per costruire un systemmessage strutturato
function toSystemMessage(systemprompt: SystemMessageFields): SystemMessage {
  if (typeof systemprompt === "string") {
    return new SystemMessage(systemprompt);
  }
  // Se content è un array o struttura complessa, estrai solo la parte testuale principale
  if (typeof systemprompt.content === "string") {
    return new SystemMessage(systemprompt.content);
  }
  if (Array.isArray(systemprompt.content)) {
    // Ad esempio concatena i blocchi di testo in stringa semplice
    const combinedContent = systemprompt.content
      .map(block => typeof block === "string" ? block : JSON.stringify(block))
      .join("\n");
    return new SystemMessage(combinedContent);
  }

  // Fallback: serializza tutto in stringa
  return new SystemMessage(JSON.stringify(systemprompt.content));
}

function toHumanMessage(question: HumanMessageFields): HumanMessage {
  if (typeof question === "string") {
    return new HumanMessage(question);
  }
  if (typeof question.content === "string") {
    return new HumanMessage(question.content);
  }
  if (Array.isArray(question.content)) {
    const combinedContent = question.content
      .map(block => typeof block === "string" ? block : JSON.stringify(block))
      .join("\n");
    return new HumanMessage(combinedContent);
  }
  return new HumanMessage(JSON.stringify(question.content));
}

