import '../../../logger.js';
import { NextFunction } from "express";
import { LLMProvider } from "../../models/llmprovider.enum.js";
import { defaultPreprocessor, getDataByResponseHttp, handleAgent, Preprocessor } from '../../services/handler.service.js';
import { CybersecurityAPITool } from "../../tools/cybersecurityapi.tool.js";
import { cyberSecurityPreprocessor, clickbaitAgentPreprocessor } from './preprocessor.js';
import { handleToolErrors, createSummaryMemoryMiddleware } from '../../services/agents/middleware.service.js';
import * as requestIp from 'request-ip';
import { ConfigChainPrompt } from '../../interfaces/configchainprompt.interface.js';
import { DataRequest } from '../../interfaces/datarequest.interface.js';
import { CONTEXT_MANAGER, contextFolder} from '../../services/common.services.js';
import { SubAgentTool } from '../../tools/subagent.tool.js';
import { getSectionsPrompts } from '../../services/business/reader-prompt.service.js';
import fs from 'fs';
import { getConfigChainpromptDFL } from '../../models/converter.models.js';
import { EmbeddingProvider } from '../../models/embeddingprovider.enum.js';
import { scrapingTool } from '../../tools/suite.tools.js';
import { buildAgent } from '../../services/agents/agent.service.js';

//XXX: tutti i contesti esistenti sul fileset
const contexts = fs.readdirSync(contextFolder);


/**
 * 
 * @param req Handler sperimentale per invocare agenti manager supervisor .
 Questo handler invoca un agente a cui sono agganciati come tool tutti gli agenti tematici riconosciuti dal sistema
 * @param res 
 * @param next 
 * @param provider 
 * @param tools 
 */
export async function agentManagerHandler(
  req: any,
  res: any,
  next: any,
  provider: LLMProvider,
  tools: any[] = [],
  providerEmbeddings: EmbeddingProvider = EmbeddingProvider.Ollama,
) {
  try {

    let context = CONTEXT_MANAGER;
    //step 1. recupero dati da una richiesta http
    const { systemPrompt, resultData, } = await getDataByResponseHttp(req, context, requestIp.getClientIp(req)!, defaultPreprocessor, true);

    //middleware istanziato dall'handler.
    //significa che ci saranno handler eterogenei nel protocollo di comunicazione che afferiranno middleware e tools all'agente creato
    //per ora l'handler è studiato per essere chiamato da un endpoint rest, in futuro ci saranno handler per altri protocolli (websocket, socket.io, la qualunque socket, ecc...)
    const middleware = [handleToolErrors, createSummaryMemoryMiddleware(resultData.modelname!) /*, dynamicSystemPrompt*/];

    const { temperature, modelname, maxTokens, numCtx, format, keyconversation }: DataRequest = resultData;
    let config: ConfigChainPrompt = {
      ...getConfigChainpromptDFL(), temperature, modelname, maxTokens, numCtx, format
    };
    //step 2. istanza e invocazione dell'agente

    let subContexts: string[] = [
      'docentelinux', 'regexp', 'whatif', 'whenudie'
    ];

    //aggiorna i prompt sul database vettoriale ad ogni chiamata (valutare strategie piu efficienti)

    //XXX: inserimento di tutti gli agenti tematici idonei
    //recupero dell'istanza vectorstore per fornire al tool l'accesso ai dati memorizzati
    //    let vectorStore = await getVectorStoreSingleton(providerEmbeddings, getConfigEmbeddingsDFL());
    //    tools.push(new RelevantTool(provider, keyconversation, config, vectorStore));
    for (const context of subContexts) {
      const subNameAgent = "Sub Agente " + context;
      const subContext = context;

      //XXX: composizione custom di una descrizione di un tool agent estrapolando ruolo e azione dal systemprompt.
      let prRuolo = await getSectionsPrompts(subContext, "prompt.ruolo");
      let prAzione = await getSectionsPrompts(subContext, "prompt.azione");
      const descriptionSubAgent = prRuolo + "\n";//await getFrameworkPrompts(subContext);
      //console.log("System prompt subcontext: " + promptsubAgent);

      const agent = await buildAgent(subContext, config, provider);

      let subagenttool: SubAgentTool = new SubAgentTool(agent, subNameAgent, subContext, descriptionSubAgent, keyconversation);
      tools.push(subagenttool);
    }

    const answer = await handleAgent(systemPrompt, resultData, provider, tools, middleware, context);

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
 * @param req 
 * @param res 
 * @param next 
 * @param provider 
 * @param preprocessor 
 * @param tools 
 * @param context 
 * @param defaultParams 
 */
async function agentHandler(
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
    const { systemPrompt, resultData, } = await getDataByResponseHttp(req, context, requestIp.getClientIp(req)!, preprocessor, true);

    //middleware istanziato dall'handler.
    //significa che ci saranno handler eterogenei nel protocollo di comunicazione che afferiranno middleware e tools all'agente creato
    //per ora l'handler è studiato per essere chiamato da un endpoint rest, in futuro ci saranno handler per altri protocolli (websocket, socket.io, la qualunque socket, ecc...)
    const middleware = [handleToolErrors, createSummaryMemoryMiddleware(resultData.modelname!) /*, dynamicSystemPrompt*/];

    //step 2. istanza e invocazione dell'agente
    const answer = await handleAgent(systemPrompt, resultData, provider, tools, middleware, context);

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
export const handleCyberSecurityAgent = (
  req: any,
  res: any,
  next: NextFunction,
  provider: LLMProvider
) => agentHandler(req, res, next, provider, cyberSecurityPreprocessor, [new CybersecurityAPITool()], 'threatintel');

/**
 * Handler per invocare un agente incaricato a fare valutazioni di clickbait di un url 

 * @param req 
 * @param res 
 * @param next 
 * @param provider 
 * @returns 
 */
export const handleClickbaitAgent = (
  req: any,
  res: any,
  next: NextFunction,
  provider: LLMProvider
) => agentHandler(req, res, next, provider, clickbaitAgentPreprocessor, [scrapingTool], 'clickbaitscore');

export const handleCommonAgentRequest = (
  req: any,
  res: any,
  next: NextFunction,
  provider: LLMProvider
) => agentHandler(
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



