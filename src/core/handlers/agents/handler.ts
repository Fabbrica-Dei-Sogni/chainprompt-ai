import '../../../logger.js';
import { NextFunction } from "express";
import { DataRequest } from "../../interfaces/datarequest.js";
import { LLMProvider } from "../../models/llmprovider.enum.js";
import { getDataRequest, handleAgent } from '../../services/reasoning/llm-handler.service.js';
import * as requestIp from 'request-ip';
import { RequestBody } from "../../interfaces/requestbody.js";
import { Tool } from "@langchain/core/tools";
import { CybersecurityAPITool } from "../../tools/cybersecurityapi.tool.js";
import { ScrapingTool } from "../../tools/scraping.tool.js";
import { cyberSecurityPreprocessor, clickbaitAgentPreprocessor, defaultPreprocessor } from './preprocessor.js';
import { handleToolErrors, createSummaryMemoryMiddleware } from '../../services/agents/middleware.service.js';

export type Preprocessor = (req: any) => Promise<void>;

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
  tools: Tool[],
  context: string,
  defaultParams?: Partial<DataRequest>
) {
  try {

    //in questa fase il body puo avere parametri che non sono contemplati nel tipo RequestBody, ma che sono utilizzati dalla fase di proprocessing del tema dedicato.
    //si vuole lasciare libertà di input tra le fasi di preparazione del prompt di un chat tematico dalla fase di interrogazione llm
    await preprocessor(req);
    // Applica i parametri di default che mancano. attualmente è ininfluente
    Object.assign(req.body, defaultParams);
    let body = req.body as RequestBody;
    //dopo il preprocessing per il tema dedicato vengono recuperati l'identificativo, in questo caso l'ip address del chiamante, e il body ricevuto dagli endpoint applicativi che sono a norma per una interrogazione llm
    //recupero identificativo chiamante, in questo caso l'ip address
    const identifier = requestIp.getClientIp(req)!;
    console.log("Identificativo chiamante: ", identifier);
    //recupero del requestbody 
    const inputData: DataRequest = getDataRequest(body, context, identifier, true);


    const { modelname }: DataRequest = inputData;
    //middleware istanziato dall'handler.
    //significa che ci saranno handler eterogenei nel protocollo di comunicazione che afferiranno middleware e tools all'agente creato
    //per ora l'handler è studiato per essere chiamato da un endpoint rest, in futuro ci saranno handler per altri protocolli (websocket, socket.io, la qualunque socket, ecc...)
    const middleware = [handleToolErrors, createSummaryMemoryMiddleware(modelname!) /*, dynamicSystemPrompt*/];
    
    const answer = await handleAgent(inputData, context, provider, tools, middleware);

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