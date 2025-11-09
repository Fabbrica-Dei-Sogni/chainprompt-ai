import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama, Ollama } from "@langchain/ollama";
import { Runnable, RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";
import { ChainPromptBaseTemplate, CHAT_PROMPT } from "../interfaces/chainpromptbasetemplate.js";
import { LLMProvider } from "../models/llmprovider.enum.js";
import '../../logger.js';
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RedisChatMessageHistory } from "@langchain/redis";
import { createClient, RedisClientType } from "redis";

dotenv.config();

//XXX: dedicare una classe ad hoc per gestire gli accessi a redis e alla memoria in generale
// Connessione Redis singleton configurata una volta
class RedisClient {
  public client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: 'redis://' + process.env.REDIS_HOST + ':' + (process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD, // Good practice: use environment variables,
      database: Number(process.env.REDIS_DB) || 0,
      socket: {
        reconnectStrategy: (retries: any) => {
          if (retries > 5) return new Error('Too many attempts to reconnect to Redis');
          return Math.min(retries * 100, 2000); // ms delay tra tentativi
        },
        connectTimeout: 5000,
      }
    });

    // Error handling
    this.client.on('error', (err: Error) => {
      console.error('R[REDIS] Error:', err);
    });
    this.connectRedis().catch(console.error)

  }

  // Connecting to the Redis server
  async connectRedis(): Promise<void> {
    await this.client.connect();
    console.log('[REDIS] Connected.');
  }
}

const redisClientInstance = new RedisClient();

// Funzione helper per Redis history (riusa da prima)
export async function getMessageHistory(sessionId: string): Promise<RedisChatMessageHistory> {
  return new RedisChatMessageHistory({
    sessionId: `conversation:${sessionId}`,
    client: redisClientInstance.client,
    sessionTTL: 86400,
  });
};

// Assumendo getMessageHistory già definita come da te
export async function logConversationHistory(sessionId: string) {
  const history = await getMessageHistory(sessionId);
  const messages = await history.getMessages(); // Restituisce BaseMessage[]

  console.log(`Messaggi nella conversazione ${sessionId}:`);
  messages.forEach((msg, idx) => {
    // msg è istanza di BaseMessage, HumanMessage, AIMessage ecc.
    console.log(`[${idx}] Tipo: ${msg._getType()} | Contenuto: ${msg.content}`);
  });
}

export async function getChainWithHistory(prompt: ChainPromptBaseTemplate, llm: Runnable, noappendchat: boolean | undefined, sessionId: string) {
  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", prompt.systemprompt as any],
    new MessagesPlaceholder("history"),
    new MessagesPlaceholder("input"),
  ]);
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
}