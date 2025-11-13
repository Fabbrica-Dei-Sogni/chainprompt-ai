import '../../../logger.js';
import { NextFunction } from "express";
import { LLMProvider } from "../../models/llmprovider.enum.js";
import { defaultPreprocessor, getDataByResponseHttp, handleAgent, Preprocessor } from '../../services/handler.service.js';
import { CybersecurityAPITool } from "../../tools/cybersecurityapi.tool.js";
import { ScrapingTool } from "../../tools/scraping.tool.js";
import { cyberSecurityPreprocessor, clickbaitAgentPreprocessor } from './preprocessor.js';
import { handleToolErrors, createSummaryMemoryMiddleware } from '../../services/agents/middleware.service.js';
import * as requestIp from 'request-ip';
import { ConfigChainPrompt } from '../../interfaces/configchainprompt.js';
import { DataRequest } from '../../interfaces/datarequest.js';
import { ENDPOINT_CHATGENERICA } from '../../services/common.services.js';
import { SubAgentTool } from '../../tools/subagent.tool.js';
import { getFrameworkPrompts } from '../../services/business/reader-prompt.service.js';

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

    const { temperature, modelname, maxTokens, numCtx, format }: DataRequest = resultData;
    let config: ConfigChainPrompt = {
      temperature, modelname, maxTokens, numCtx, format
    };
    //const formattedSystemPrompt = await getFormattedSystemPrompt(context, provider, config, systemPrompt);
    //step 2. istanza e invocazione dell'agente
    const formattedSystemPrompt = systemPrompt;
    const answer = await handleAgent(formattedSystemPrompt, resultData, provider, tools, middleware, context);

    //step 3. ritorno la response http
    res.json(answer);

  } catch (err) {
    console.error('Errore durante la conversazione:', err);
    res.status(500).json({ error: "Errore interno" });
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
) => agentHandler(req, res, next, provider, clickbaitAgentPreprocessor, [new ScrapingTool()], 'clickbaitscore');

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




export async function agentManagerHandler(
  req: any,
  res: any,
  next: any,
  provider: LLMProvider,
  tools: any[] = []
) {
  try {
    
    let context = ENDPOINT_CHATGENERICA;
    //step 1. recupero dati da una richiesta http
    const { systemPrompt, resultData, } = await getDataByResponseHttp(req, context, requestIp.getClientIp(req)!, defaultPreprocessor, true);

    //middleware istanziato dall'handler.
    //significa che ci saranno handler eterogenei nel protocollo di comunicazione che afferiranno middleware e tools all'agente creato
    //per ora l'handler è studiato per essere chiamato da un endpoint rest, in futuro ci saranno handler per altri protocolli (websocket, socket.io, la qualunque socket, ecc...)
    const middleware = [handleToolErrors, createSummaryMemoryMiddleware(resultData.modelname!) /*, dynamicSystemPrompt*/];

    const { temperature, modelname, maxTokens, numCtx, format, keyconversation }: DataRequest = resultData;
    let config: ConfigChainPrompt = {
      temperature, modelname, maxTokens, numCtx, format
    };
    //const formattedSystemPrompt = await getFormattedSystemPrompt(context, provider, config, systemPrompt);
    //step 2. istanza e invocazione dell'agente
    const formattedSystemPrompt = systemPrompt;

    const subContext = "whatif";
    const promptsubAgent = await getFrameworkPrompts(subContext); // Ottieni il prompt di sistema per il contesto
    console.log("System prompt subcontext: " + promptsubAgent);
    //const formattedPromptsubAgent = await getFormattedSystemPrompt(subContext, provider, config, systemPrompt);
    let subagenttool: SubAgentTool = new SubAgentTool("Mr Distopia","whatif",promptsubAgent, provider,keyconversation,config);

    tools.push(subagenttool);
    const answer = await handleAgent(formattedSystemPrompt, resultData, provider, tools, middleware, context);

    //step 3. ritorno la response http
    res.json(answer);

  } catch (err) {
    console.error('Errore durante la conversazione:', err);
    res.status(500).json({ error: "Errore interno" });
  }
};