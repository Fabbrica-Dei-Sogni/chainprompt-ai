import { Runnable, RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables";
import { getPromptTemplate } from "../../../templates/chainpromptbase.template.js";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RedisChatMessageHistory } from "@langchain/redis";
import { REDIS_CLIENT_INSTANCE } from "./redis.client.js";
import '../../../../backend/logger.backend.js';
/**

Servizio dedicato a operazioni di storage redis.

Attualmente è presente la gestione dello storico di una conversazione 
con l'ausilio della classe RedisChatMessageHistory

 */


// Funzione helper per Redis history (riusa da prima)
export async function getMessageHistory(sessionId: string): Promise<RedisChatMessageHistory> {
  return new RedisChatMessageHistory({
    sessionId: `conversation:${sessionId}`,
    client: REDIS_CLIENT_INSTANCE.client,
    sessionTTL: 86400,
  });
};

/**
 * Metodo di servizio per ottenere un chain a partire dal modello llm scelto per integrare il getMessageHistory dove richiesto
 * @param systemPrompt 
 * @param llm 
 * @param noappendchat 
 * @param sessionId 
 * @returns 
 */
export async function getChainWithHistory(systemPrompt: any, llm: Runnable, noappendchat: boolean | undefined, sessionId: string) {

  const promptTemplate = getPromptTemplate(systemPrompt);

  // Chain base: prompt | LLM | parser (sostituisce invokeChain)
  const baseChain = RunnableSequence.from([
    promptTemplate,
    llm,
    new StringOutputParser(),
  ]);
  // Wrapper con history (usa BufferMemory implicit per append, ma qui diretto via getMessageHistory)
  const chainWithHistory = new RunnableWithMessageHistory({
    runnable: baseChain,
    getMessageHistory,
    inputMessagesKey: "input",
    historyMessagesKey: "history",
  });

  // Gestisci clear se noappendchat (reset history per nuova conv)
  if (noappendchat) {
    const history = await getMessageHistory(sessionId);
    await history.clear();
  }
  return chainWithHistory;
};

/**
 * Questi metodi di logging sono a puro scopo di console.
 Le metriche e l'analisi delle informazioni utilizzare langsmith e affini.
 * @param sessionId  */
// Assumendo getMessageHistory già definita come da te
export async function logConversationHistory(sessionId: string) {
  const history = await getMessageHistory(sessionId);
  const messages = await history.getMessages(); // Restituisce BaseMessage[]

  console.log(`Messaggi nella conversazione ${sessionId}:`);
  messages.forEach((msg, idx) => {
    // msg è istanza di BaseMessage, HumanMessage, AIMessage ecc.
    console.log(`[${idx}] Tipo: ${msg._getType()} | Contenuto: ${msg.content}`);
  });
};