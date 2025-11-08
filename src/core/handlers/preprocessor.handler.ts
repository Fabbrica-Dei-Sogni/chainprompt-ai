import { NextFunction } from "express";
import { YouTubeComment, formatCommentsForPrompt } from "../agents/analisicommenti.agent.js";
import { removeCheshireCatText } from "../agents/cheshire.agent.js";
import { decodeBase64, scrapeArticle } from "../agents/clickbaitscore.agent.js";
import { getAnswerByPrompt } from "../controllers/business.controller.js";
import { DataRequest } from "../interfaces/datarequest.js";
import { LLMProvider } from "../models/llmprovider.enum.js";
import { handle } from '../services/llm-request-handler.service.js';
import * as requestIp from 'request-ip';
import { RequestBody } from "../interfaces/requestbody.js";

export type Preprocessor = (req: any) => Promise<void>;

async function genericHandler(
  req: any,
  res: any,
  next: any,
  provider: LLMProvider,
  preprocessor: Preprocessor,
  contextchat: string,
  defaultParams?: Partial<DataRequest>
) {
  try {

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

    const answer = await handlePrompt(body, identifier, contextchat, provider);

    res.json(answer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Errore interno" });
  }
};

const handlePrompt = async (body: RequestBody, identifier: string, contextchat: any, provider: LLMProvider): Promise<any> => {
  try {

    return handle(identifier, body, contextchat,
      //l'estrazione dei dati dal body  avviene nella fase di handler, successivamente i dati estratti sono forniti al getAnserByPrompt  
      async (inputData: DataRequest, systemPrompt: string) =>
        getAnswerByPrompt(provider, inputData, systemPrompt));
  } catch (err) {
    console.error('Errore durante la conversazione:', err);
    throw err;
    //res.status(500).json({ error: `Si è verificato un errore interno del server` });
  }
};

//
// Preprocessori specifici per ciascun contesto
//

/**
 * Preprocessore per clickbaitscore (scraping + decode + set parametri)
 * @param req 
 */
const clickbaitPreprocessor: Preprocessor = async (req) => {
  try {
    const { url } = req.body;
    if (!url) {
      throw new Error("URL mancante nel payload per clickbaitscore");
    }
    const decodedUri = decodeBase64(url);
    const { title, content } = await scrapeArticle(decodedUri);
    req.body.question = `<TITOLO>${title}</TITOLO>\n<ARTICOLO>${content}</ARTICOLO>\n`;
    req.body.numCtx = req.body.numCtx ?? 2040;
    req.body.maxToken = req.body.maxToken ?? 8032;
    req.body.noappendchat = true;
  } catch (error) {
    console.error("Errore nel preprocessore clickbaitscore:", error);
    throw error;  // rilancia per essere gestito centralmente
  }
};

/**
Preprocessore per cheshire (rimuove testo indesiderato + no append)
 * 
 * @param req 
 */
const cheshirePreprocessor: Preprocessor = async (req) => {
  try {
    req.body.noappendchat = true;
    if (!req.body.text) {
      throw new Error("Campo 'text' mancante per preprocessore Cheshire");
    }
    req.body.text = removeCheshireCatText(req.body.text);
  } catch (error) {
    console.error("Errore nel preprocessore cheshirecat:", error);
    throw error;
  }
};

/**
  Preprocessore per analisi commenti YouTube (formatta payload + setta no append)
 * 
 * @param req 
 */
const analisiCommentiPreprocessor: Preprocessor = async (req) => {
  try {
    const { payload } = req.body;
    if (!payload) {
      throw new Error("Payload commenti mancante per analisi commenti");
    }
    const comments: YouTubeComment[] = payload;
    const prompt = formatCommentsForPrompt(comments);
    req.body.question = prompt;

    req.body.numCtx = req.body.numCtx ?? 2040;
    req.body.maxToken = req.body.maxToken ?? null;
    req.body.noappendchat = true;
  } catch (error) {
    console.error("Errore nel preprocessore analisi commenti:", error);
    throw error;
  }
};

/**
 Preprocessore di default (nessuna modifica, utile per casi generici)
 * @param req 
 */
const defaultPreprocessor: Preprocessor = async (req) => {
  try {
    // Nessuna modifica, usato per contesti generici
  } catch (error) {
    console.error("Errore nel preprocessore di default:", error);
    throw error;
  }
};

//
// Esportazione degli handler specifici usando la funzione generica
//

export const handleClickbaitRequest = (
  req: any,
  res: any,
  next: NextFunction,
  provider: LLMProvider
) => genericHandler(req, res, next, provider, clickbaitPreprocessor, 'clickbaitscore');

export const handleCheshireRequest = (
  req: any,
  res: any,
  next: NextFunction,
  provider: LLMProvider
) => genericHandler(req, res, next, provider, cheshirePreprocessor, 'cheshirecat');

export const handleAnalisiCommentiRequest = (
  req: any,
  res: any,
  next: NextFunction,
  provider: LLMProvider
) => genericHandler(req, res, next, provider, analisiCommentiPreprocessor, 'analisicommenti');

export const handleCommonRequest = (
  req: any,
  res: any,
  next: NextFunction,
  provider: LLMProvider
) => genericHandler(
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