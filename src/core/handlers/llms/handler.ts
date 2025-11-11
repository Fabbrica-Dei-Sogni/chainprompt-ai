import { NextFunction } from "express";
import { LLMProvider } from "../../models/llmprovider.enum.js";
import { getData,  handleLLM, Preprocessor } from '../../services/handler.service.js';
import '../../../logger.js';
import { defaultPreprocessor } from "../agents/preprocessor.js";
import { clickbaitPreprocessor, cheshirePreprocessor, analisiCommentiPreprocessor } from "./preprocessor.js";

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

    //in questa fase il body puo avere parametri che non sono contemplati nel tipo RequestBody, ma che sono utilizzati dalla fase di proprocessing del tema dedicato.
    //si vuole lasciare libertà di input tra le fasi di preparazione del prompt di un chat tematico dalla fase di interrogazione llm
    await preprocessor(req);

    const { systemPrompt, inputData } = await getData(req, context);

    const answer = await handleLLM(systemPrompt, inputData, provider);

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
