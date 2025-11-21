import '../logger.backend.js';
import { NextFunction, Request, Response } from "express";
import { LLMProvider } from "../../core/enums/llmprovider.enum.js";
import { CybersecurityAPITool } from "../tools/cybersecurityapi.tool.js";
import { handleToolErrors, createSummaryMemoryMiddleware } from '../services/business/agents/middleware.service.js';
import * as requestIp from 'request-ip';
import { SubAgentTool } from '../tools/subagent.tool.js';
import { getSectionsPrompts } from '../services/business/reader-prompt.service.js';
import { getAgentContent } from '../../core/converter.models.js';
import { buildAgent } from '../services/business/agents/agent.service.js';
import { DataRequest } from '../../core/interfaces/protocol/datarequest.interface.js';
import { CONTEXT_MANAGER } from '../services/common.service.js';
import { defaultPreprocessor, getDataByResponseHttp, handleAgent, Preprocessor } from '../services/business/handler.service.js';
import { ScrapingToolStructured } from '../tools/scraping.structured.tool.js';
import { decodeBase64 } from '../utils/clickbaitscore.util.js';

export class AgentController {

  private static instance: AgentController;

  private constructor() { }

  public static getInstance(): AgentController {
    if (!AgentController.instance) {
      AgentController.instance = new AgentController();
    }
    return AgentController.instance;
  }

  /**
   * 
   * @param req Handler sperimentale per invocare agenti manager supervisor .
   Questo handler invoca un agente a cui sono agganciati come tool tutti gli agenti tematici riconosciuti dal sistema
   * @param res 
   * @param next 
   * @param provider 
   * @param tools 
   */
  public async agentManagerHandler(
    req: any,
    res: any,
    next: any,
    provider: LLMProvider,
    tools: any[] = [],
    subContexts: any[]
  ) {
    try {

      let context = CONTEXT_MANAGER;
      //step 1. recupero dati da una richiesta http
      //valorizzato il provider sul body request dall'handler
      req.body = {
        ...req.body,
        provider
      };
      const { systemPrompt, resultData, } = await getDataByResponseHttp(req, context, requestIp.getClientIp(req)!, defaultPreprocessor, true);

      //middleware istanziato dall'handler.
      //significa che ci saranno handler eterogenei nel protocollo di comunicazione che afferiranno middleware e tools all'agente creato
      //per ora l'handler è studiato per essere chiamato da un endpoint rest, in futuro ci saranno handler per altri protocolli (websocket, socket.io, la qualunque socket, ecc...)
      const middleware = [handleToolErrors, createSummaryMemoryMiddleware(resultData.config.modelname!) /*, dynamicSystemPrompt*/];

      const { keyconversation, config }: DataRequest = resultData;
      //step 2. istanza e invocazione dell'agente


      //aggiorna i prompt sul database vettoriale ad ogni chiamata (valutare strategie piu efficienti)

      //XXX: inserimento di tutti gli agenti tematici idonei
      //recupero dell'istanza vectorstore per fornire al tool l'accesso ai dati memorizzati
      //    let vectorStore = await getVectorStoreSingleton(providerEmbeddings, getConfigEmbeddingsDFL());
      //    tools.push(new RelevantTool(provider, keyconversation, config, vectorStore));
      for (const context of subContexts) {
        const subNameAgent = "Mr. " + context;
        const subContext = context;

        //XXX: composizione custom di una descrizione di un tool agent estrapolando ruolo e azione dal systemprompt.
        let prRuolo = await getSectionsPrompts(subContext, "prompt.ruolo");
        let prAzione = await getSectionsPrompts(subContext, "prompt.azione");
        const descriptionSubAgent = prRuolo + "\n" + prAzione;

        const agent = await buildAgent(subContext, config);

        let subagenttool: SubAgentTool = new SubAgentTool(agent, subNameAgent, subContext, descriptionSubAgent, keyconversation);
        tools.push(subagenttool);
      }

      const result = await handleAgent(systemPrompt, resultData, tools, middleware, context);
      let answer = getAgentContent(result);

      //step 3. ritorno la response http
      res.json(answer);

    } catch (err) {
      console.error('Errore di esecuzione di un agente manager:', JSON.stringify(err));
      res.status(500).json({ error: "Errore interno ", err });
    }
  };

  /**
   * Gestione degli handler http rest per invocare un agente associato a un contesto
   Ciascun contesto puo avere un handle personalizzato, altrimenti viene gestito dall'handler comune (autogenera un endpoint rest dedicato).
    * 
    * @param req 
    * @param res 
    * @param next 
    * @param provider 
    * @param preprocessor 
    * @param tools 
    * @param context 
    */
  private async agentHandler(
    req: any,
    res: any,
    next: any,
    provider: LLMProvider,
    preprocessor: Preprocessor,
    tools: any[],
    context: string
  ) {
    try {

      //step 1. recupero dati da una richiesta http
      //valorizzato il provider sul body request dall'handler
      req.body = {
        ...req.body,
        provider
      };
      const { systemPrompt, resultData, } = await getDataByResponseHttp(req, context, requestIp.getClientIp(req)!, preprocessor, true);

      //middleware istanziato dall'handler.
      //significa che ci saranno handler eterogenei nel protocollo di comunicazione che afferiranno middleware e tools all'agente creato
      //per ora l'handler è studiato per essere chiamato da un endpoint rest, in futuro ci saranno handler per altri protocolli (websocket, socket.io, la qualunque socket, ecc...)
      const middleware = [handleToolErrors, createSummaryMemoryMiddleware(resultData.config.modelname!) /*, dynamicSystemPrompt*/];

      //step 2. istanza e invocazione dell'agente
      const result = await handleAgent(systemPrompt, resultData, tools, middleware, context);
      let answer = getAgentContent(result);
      //step 3. ritorno la response http
      res.json(answer);

    } catch (err) {
      console.error('Errore durante la esecuzione di un agente:', err);
      res.status(500).json({ error: "Errore interno", err });
    }
  };

  //handle http per invocare un agente esperto in cybersecurity (vedi system prompt nel datasets/fileset)
  //i contesti sono estrapolati dalle sotto folder create nella directory datasets/fileset
  //ciascuna cartella contiene un system prompt separato in 4 file prompt (ruolo, obiettivo, azione, contesto)

  /**
   * Handler http per invocare un agente esperto in cybersecurity
   * @param req 
   * @param res 
   * @param next 
   * @param provider 
   * @returns 
   */
  public handleCyberSecurityAgent = (
    req: any,
    res: any,
    next: NextFunction,
    provider: LLMProvider
  ) => this.agentHandler(req, res, next, provider, this.cyberSecurityPreprocessor, [new CybersecurityAPITool()], 'threatintel');

  /**
   * Handler per invocare un agente incaricato a fare valutazioni di clickbait di un url 
   * 
   * @param req 
   * @param res 
   * @param next 
   * @param provider 
   * @returns 
   */
  public handleClickbaitAgent = (
    req: any,
    res: any,
    next: NextFunction,
    provider: LLMProvider
  ) => this.agentHandler(req, res, next, provider, this.clickbaitAgentPreprocessor, [new ScrapingToolStructured()], 'clickbaitscore');

  public handleCommonAgentRequest = (
    req: any,
    res: any,
    next: NextFunction,
    provider: LLMProvider
  ) => this.agentHandler(
    req,
    res,
    next,
    provider,
    defaultPreprocessor,
    [],
    (() => {
      // Esempio di estrazione contesto generico ed elegante da req.originalUrl
      const originalUriTokens = req.originalUrl.split('/');
      return originalUriTokens[originalUriTokens.length - 1];
    })()
  );

  private cyberSecurityPreprocessor: Preprocessor = async (req) => {
    try {
      // Nessuna modifica, usato per contesti generici
      console.info("Sconfiggi l'inferno apocalittico!! Forza e coraggio!");
    } catch (error) {
      console.error("Errore nel preprocessore di default:", error);
      throw error;
    }
  };

  private clickbaitAgentPreprocessor: Preprocessor = async (req) => {
    try {
      const { url } = req.body;
      if (!url) {
        throw new Error("URL mancante nel payload per clickbaitscore");
      }
      const decodedUri = decodeBase64(url);
      req.body.question = decodedUri;
      req.body.numCtx = req.body.numCtx ?? 2040;
      req.body.maxToken = req.body.maxToken ?? 8032;
      req.body.noappendchat = true;
    } catch (error) {
      console.error("Errore nel preprocessore agente clickbaitscore:", error);
      throw error;  // rilancia per essere gestito centralmente
    }
  };
}

export const agentController = AgentController.getInstance();



