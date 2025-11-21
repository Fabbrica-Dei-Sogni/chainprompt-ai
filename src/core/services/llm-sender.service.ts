
/**
 * La classe rappresenta l'insieme di endpoint per interagire con i server llm tramite il middleware di langchain
 */
import { ConfigChainPrompt } from "../interfaces/protocol/configchainprompt.interface.js";
import { DataRequest } from "../interfaces/protocol/datarequest.interface.js";
import { llmChainService } from './llm-chain.service.js';
import { AgentMiddleware } from 'langchain';
import { llmAgentService } from "./llm-agent.service.js";
import { Runnable, RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HumanMessageFields, MessageStructure } from "@langchain/core/messages";
import { logger } from '../logger.core.js';

export class LLMSenderService {
  private static instance: LLMSenderService;

  private constructor() { }

  public static getInstance(): LLMSenderService {
    if (!LLMSenderService.instance) {
      LLMSenderService.instance = new LLMSenderService();
    }
    return LLMSenderService.instance;
  }

  /**
   * Il metodo ha lo scopo di gestire i valori di input entranti dalla richiesta,
   * istanziare la configurazione del modello llm in ConfigChainPrompt, ciascun parametro è peculiare in base al modello llm scelto per interrogare,
   * impostare il template del prompt in questo caso il prompt è formato da un systemprompt e un userprompt che sono gia preimpostati in modo opportuno a monte.
   * In futuro potranno esserci prompt template con logiche diverse per assolvere scopi piu dinamici e granulati a seconda l'esigenza applicativa.
   * Viene interrogato l'llm in base al tipo di accesso (locale, cloud, ollama server, ecc...)
   * La risposta viene tracciata nello storico di conversazione e salvato su un file di testo (in futuro ci saranno tecniche piu avanzate)
   * La risposta viene ritornata al chiamante.
   * 
    * @param inputData 
    * @param systemPrompt 
    * @param provider 
    * @param chainWithHistory 
    * @returns 
    */
  public async senderToLLM(inputData: DataRequest, systemPrompt: string, promptTemplate: ChatPromptTemplate<any, any>, chainWithHistory?: Runnable<any, any>) {

    //XXX: vengono recuperati tutti i parametri provenienti dalla request, i parametri qui recuperati potrebbero aumentare nel tempo
    const { question, keyconversation, config }: DataRequest = inputData;//extractDataFromRequest(req, contextchat);

    logger.info(`System prompt contestuale:\n ${systemPrompt}`);
    logger.info(`Question prompt utente:\n${question}`);

    const chainToInvoke = chainWithHistory ?? this.getChain(llmChainService.getInstanceLLM(config), promptTemplate);

    const answer = await this.invokeChain(question as any, keyconversation, chainToInvoke);
    logger.info(`Risposta assistente:\n${answer}`);

    //XXX: questo aspetto e' cruciale per ridirigere e modellare i flussi applicativi tramite prompts in entrata e in uscita.
    return answer;
  }

  /**
   * Ritorna un chain base senza history conversazionale
   * @param systemPrompt 
   * @param llm 
   * @returns 
   */
  public getChain(llm: Runnable, promptTemplate: ChatPromptTemplate<any, any>) {

    // Chain base: prompt | LLM | parser (sostituisce invokeChain)
    const baseChain = RunnableSequence.from([
      promptTemplate,
      llm,
      new StringOutputParser(),
    ]);

    return baseChain;
  };

  /**
   * Invoca un chain in base al prompt la sessionid e il chain with history.
   Se non viene fornito in input viene utilizzato l'history nativo su redis
  
    * @param prompt 
    * @param sessionId 
    * @param chainWithHistory 
    * @returns 
    */
  public async invokeChain(question: HumanMessageFields<MessageStructure>, sessionId: string, chain: Runnable<any, any>): Promise<string> {
    try {

      // Input per invocazione
      const input = { input: question };
      // Config con sessionId per recovery/save
      const configWithSession = { configurable: { sessionId } };
      const answer = await chain.invoke(input, configWithSession);

      //logConversationHistory(sessionId);

      //XXX: chiamata legacy con semplice chatprompt su llm senza storico
      //const llmChain = CHAT_PROMPT.pipe(llm);
      //const answer = await llmChain.invoke({ systemprompt: prompt.systemprompt, question: prompt.question });
      return answer;
    } catch (error: unknown) {

      //XXX: gestione accurata dell'errore ricevuto da un llm

      // Log dell'errore per diagnosi - sostituisci con logger reale in produzione
      logger.error("Errore durante l'invocazione della chain LLM:", error);

      // Gestione custom errori specifici (opzionale)
      if (error instanceof Error) {
        // Puoi controllare messaggi o tipi per retry, rate limit, ...
        if (error.message.includes("rate limit")) {
          // eventuale logica retry o backoff
          logger.warn("Rate limit superata. Considera retry o backoff.");
        }
      }

      // Rilancia come errore specifico oppure generico per chiamante
      throw new Error(`Errore invokeChain: ${(error as Error).message || String(error)}`);
    }
  };


  /**
   * Sender per invocare un agente 
  
   * @param question 
   * @param keyconversation 
   * @param config 
   * @param systemPrompt 
   * @param provider 
   * @param tools 
   * @param middleware 
   * @param nomeagente 
   * @returns 
   */
  public async senderToAgent(question: string, keyconversation: string, config: ConfigChainPrompt, systemPrompt: string, tools: any[], middleware: AgentMiddleware[], nomeagente: string) {

    //console.log(`System prompt contestuale:\n`, systemPrompt);
    logger.info(`Question prompt utente:\n ${question}`);

    let agent = llmAgentService.getAgent(
      llmChainService.getInstanceLLM(config),
      systemPrompt,
      tools,
      middleware,
      nomeagente);

    //XXX: il nome dell'agente per ora coincide con il nome del contesto definito nel fileset dei systemprompt tematici
    const result = await llmAgentService.invokeAgent(
      agent,
      question!,
      keyconversation);

    logger.info(`Risposta agente:\n ${result}`);
    return result;
  };
}

export const llmSenderService = LLMSenderService.getInstance();
