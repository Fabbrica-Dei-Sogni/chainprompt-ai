import { NextFunction } from "express";
import { DataRequest } from "../../interfaces/datarequest.js";
import { LLMProvider } from "../../models/llmprovider.enum.js";
import { extractDataFromRequest, handleLLM } from '../../services/reasoning/llm-handler.service.js';
import * as requestIp from 'request-ip';
import { RequestBody } from "../../interfaces/requestbody.js";
import '../../../logger.js';
import { defaultPreprocessor } from "../agents/preprocessor.js";
import { clickbaitPreprocessor, cheshirePreprocessor, analisiCommentiPreprocessor } from "./preprocessor.js";

export type Preprocessor = (req: any) => Promise<void>;

//
// Esportazione degli handler specifici usando la funzione generica
//

async function llmHandler(
  req: any,
  res: any,
  next: any,
  provider: LLMProvider,
  preprocessor: Preprocessor,
  context: string,
  defaultParams?: Partial<DataRequest>
) {
  try {

    if (next)
      console.log(next);

    //in questa fase il body puo avere parametri che non sono contemplati nel tipo RequestBody, ma che sono utilizzati dalla fase di proprocessing del tema dedicato.
    //si vuole lasciare libertà di input tra le fasi di preparazione del prompt di un chat tematico dalla fase di interrogazione llm
    await preprocessor(req);

    // Applica i parametri di default che mancano
    Object.assign(req.body, defaultParams);

    //dopo il preprocessing per il tema dedicato vengono recuperati l'identificativo, in questo caso l'ip address del chiamante, e il body ricevuto dagli endpoint applicativi che sono a norma per una interrogazione llm
    //recupero identificativo chiamante, in questo caso l'ip address
    const identifier = requestIp.getClientIp(req)!;
    //recupero del requestbody 
    let body = req.body as RequestBody;
    const inputData: DataRequest = extractDataFromRequest(body, context, identifier, true);
    
    const answer = await handleLLM(identifier, inputData, context, provider);

    res.json(answer);
  } catch (err) {
    console.error('Errore durante la conversazione:', err);
    res.status(500).json({ error: "Errore interno" });
  }
};

export const handleClickbaitRequest = (
  req: any,
  res: any,
  next: NextFunction,
  provider: LLMProvider
) => llmHandler(req, res, next, provider, clickbaitPreprocessor, 'clickbaitscore');

export const handleCheshireRequest = (
  req: any,
  res: any,
  next: NextFunction,
  provider: LLMProvider
) => llmHandler(req, res, next, provider, cheshirePreprocessor, 'cheshirecat');

export const handleAnalisiCommentiRequest = (
  req: any,
  res: any,
  next: NextFunction,
  provider: LLMProvider
) => llmHandler(req, res, next, provider, analisiCommentiPreprocessor, 'analisicommenti');

export const handleCommonRequest = (
  req: any,
  res: any,
  next: NextFunction,
  provider: LLMProvider
) => llmHandler(
  req,
  res,
  next,
  provider,
  defaultPreprocessor,
  (() => {
    // Esempio di estrazione contesto generico ed elegante da req.originalUrl
    const originalUriTokens = req.originalUrl.split('/');
    return originalUriTokens[originalUriTokens.length - 1];
  })()
);