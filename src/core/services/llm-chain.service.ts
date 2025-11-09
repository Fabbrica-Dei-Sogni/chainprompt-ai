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

/*
 * La seguente implementazione raccoglie metodi per interrogare modelli LLM con la libreria Langchain configurandone i parametri peculiari di ciascun modello usato processandone il prompt seguendo il pattern base:
 * systemprompt e userprompt.
 * 
 * Ha lo scopo di fornire uno standard di richiesta e ritorno risposta da un modello llm delegando all'applicazione il modo con cui il system e l'user prompt vengono costruiti.
 * La response di questi metodi generano un prompt di tipo assistant il quale puo essere o un output finale di una chatbot oppure l'input di una nuova catena di prompt.
 * 
 * Implementazioni simili potranno essere sviluppati usando template prompt diversi con relativo tier di servizi dedicati in base all'obiettivo richiesto.
 * 
 * L'obiettivo di questa implementazione è fornire accurati prompt separando in modo netto il system e l'user prompt, focalizzando la configurazione dei modelli.
 */

// Funzione helper per Redis history (riusa da prima)
async function getMessageHistory(sessionId: string): Promise<RedisChatMessageHistory> {
  return new RedisChatMessageHistory({
    sessionId: `conversation:${sessionId}`,
    client: redisClientInstance.client,
    sessionTTL: 86400,
  });
}
/**
 * Crea un chain llm, lo invoca e attende la risposta.

 * @param llm 
 * @param prompt 
 * @returns 
 */
export const invokeChain = async (llm: Runnable, prompt: ChainPromptBaseTemplate, sessionId: string, noappendchat?: boolean): Promise<string> => {
  try {
    //parametrizzare e astrarre la gestione tra template entrante e interpolazione con il template associato.
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

    // Input per invocazione
    const input = { input: prompt.question };

    // Config con sessionId per recovery/save
    const configWithSession = { configurable: { sessionId } };
    const answer = await chainWithHistory.invoke(input, configWithSession);

    //const llmChain = CHAT_PROMPT.pipe(llm);
    //const answer = await llmChain.invoke({ systemprompt: prompt.systemprompt, question: prompt.question });
    return answer;
  } catch (error: unknown) {

    //XXX: gestione accurata dell'errore ricevuto da un llm

    // Log dell'errore per diagnosi - sostituisci con logger reale in produzione
    console.error("Errore durante l'invocazione della chain LLM:", error);

    // Gestione custom errori specifici (opzionale)
    if (error instanceof Error) {
      // Puoi controllare messaggi o tipi per retry, rate limit, ...
      if (error.message.includes("rate limit")) {
        // eventuale logica retry o backoff
        console.warn("Rate limit superata. Considera retry o backoff.");
      }
    }

    // Rilancia come errore specifico oppure generico per chiamante
    throw new Error(`Errore invokeChain: ${(error as Error).message || String(error)}`);
  }
};

/**
 * Ritorna l'istanza di un llm in base al provider scelto.
 
 * @param provider 
 * @param config 
 * @returns 
 */
export function getInstanceLLM(provider: LLMProvider, config: ConfigChainPrompt) {
  let instance;

  switch (provider) {
    case LLMProvider.OpenAICloud:
      instance = getCloudLLM(config);
      break;
    case LLMProvider.OpenAILocal:
      instance = getLocalLLM(config);
      break;
    case LLMProvider.Ollama:
      instance = getOllamaLLM(config);
      break;
    case LLMProvider.ChatOllama:
      instance = getChatOllamaLLM(config);
      break;
    default:
      throw new Error(`Provider non supportato: ${provider}`);
  }
  return instance;
};


const getCloudLLM = (config: ConfigChainPrompt) => {

  const llm = new ChatOpenAI({
    maxTokens: config.maxTokens,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: config.temperature,
    modelName: config.modelname || process.env.LOCAL_MODEL_NAME
    /**
    il cast forzato a runnable in questa forma
    è accettabile come pragmatismo in progetti complessi, per ora, se usato consapevolmente e documentato, senza compromettere la manutenzione futura.
     */
  }) as unknown as Runnable;

  return llm;

};


const getLocalLLM = (config: ConfigChainPrompt) => {

  const llm = new ChatOpenAI({
    configuration: {
      baseURL: process.env.URI_LANGCHAIN_LLMSTUDIO,
    },
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    modelName: config.modelname || process.env.LOCAL_MODEL_NAME
    /**
    il cast forzato a runnable in questa forma
    è accettabile come pragmatismo in progetti complessi, per ora, se usato consapevolmente e documentato, senza compromettere la manutenzione futura.
     */
  }) as unknown as Runnable;

  return llm;

};

const getChatOllamaLLM = (config: ConfigChainPrompt) => {

  const llm = new ChatOllama({
    baseUrl: process.env.URI_LANGCHAIN_OLLAMA,
    temperature: config.temperature,
    //in questa casistica il modelname è fornito da openui e il server ollama e a local name puo anche non esserci nulla, al piu da un errore
    model: config.modelname || process.env.LOCAL_MODEL_NAME,
    numCtx: config.numCtx,
    format: config.format
    //XXX candidati nuovi parametri: saranno eventualmente messi a configurazione
    //numBatch: 512,
    //topK: 40,
    //repeatPenalty: 1.1,
    //topP: 0.95,

    //XXX: parametri da capire e sperimentare
    //keepAlive: "24h",
    //logitsAll: true,
  });
  return llm;

};

const getOllamaLLM = (config: ConfigChainPrompt) => {

  const llm = new Ollama({
    baseUrl: process.env.URI_LANGCHAIN_OLLAMA,
    temperature: config.temperature,
    //in questa casistica il modelname è fornito da openui e il server ollama e a local name puo anche non esserci nulla, al piu da un errore
    model: config.modelname || process.env.LOCAL_MODEL_NAME,
    numCtx: config.numCtx,
    format: config.format
    //XXX candidati nuovi parametri: saranno eventualmente messi a configurazione
    //numBatch: 512,
    //topK: 40,
    //repeatPenalty: 1.1,
    //topP: 0.95,

    //XXX: parametri da capire e sperimentare
    //keepAlive: "24h",
    //logitsAll: true,
  });
  return llm;

};
