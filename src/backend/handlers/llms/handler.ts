import { NextFunction } from "express";
import { LLMProvider } from "../../../core/models/llmprovider.enum.js";
import '../../logger.backend.js';
import { clickbaitPreprocessor, cheshirePreprocessor, analisiCommentiPreprocessor } from "./preprocessor.js";
import * as requestIp from 'request-ip';
import { defaultPreprocessor, getDataByResponseHttp, handleLLM, Preprocessor } from "../../services/business/handler.service.js";

//
// Esportazione degli handler specifici usando la funzione generica
//

async function llmHandler(
  req: any,
  res: any,
  next: any,
  provider: LLMProvider,
  preprocessor: Preprocessor,
  context: string
) {
  try {

    //step 1. recupero dati da una richiesta http
    const { systemPrompt, resultData } = await getDataByResponseHttp(req, context, requestIp.getClientIp(req)!, preprocessor, false);

    //step 2. istanza e invocazione dell'agente
    const answer = await handleLLM(systemPrompt, resultData, provider);

    //step 3. ritorno la response http
    res.json(answer);

  } catch (err) {
    console.error('Errore durante la esecuzione di una conversazione llm:', JSON.stringify(err));
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
