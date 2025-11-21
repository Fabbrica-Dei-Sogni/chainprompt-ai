import { NextFunction } from "express";
import { LLMProvider } from "../../core/enums/llmprovider.enum.js";
import '../logger.backend.js';
import * as requestIp from 'request-ip';
import { defaultPreprocessor, getDataByResponseHttp, handleLLM, Preprocessor } from "../services/business/handler.service.js";
import { YouTubeComment, formatCommentsForPrompt } from "../utils/analisicommenti.util.js";
import { removeCheshireCatText } from "../utils/cheshire.util.js";
import { decodeBase64, scrapeArticle } from "../utils/clickbaitscore.util.js";

//
// Esportazione degli handler specifici usando la funzione generica
//

export class LLMController {

  private static instance: LLMController;

  private constructor() { }

  public static getInstance(): LLMController {
    if (!LLMController.instance) {
      LLMController.instance = new LLMController();
    }
    return LLMController.instance;
  }

  private async llmHandler(
    req: any,
    res: any,
    next: any,
    provider: LLMProvider,
    preprocessor: Preprocessor,
    context: string
  ) {
    try {

      //step 1. recupero dati da una richiesta http
      //valorizzato il provider sul body request dall'handler
      req.body = {
        ...req.body,
        provider
      };
      const { systemPrompt, resultData } = await getDataByResponseHttp(req, context, requestIp.getClientIp(req)!, preprocessor, false);

      //step 2. istanza e invocazione dell'agente
      const answer = await handleLLM(systemPrompt, resultData);

      //step 3. ritorno la response http
      res.json(answer);

    } catch (err) {
      console.error('Errore durante la esecuzione di una conversazione llm:', JSON.stringify(err));
      res.status(500).json({ error: "Errore interno" });
    }
  };

  public handleClickbaitRequest = (
    req: any,
    res: any,
    next: NextFunction,
    provider: LLMProvider
  ) => this.llmHandler(req, res, next, provider, this.clickbaitPreprocessor, 'clickbaitscore');

  public handleCheshireRequest = (
    req: any,
    res: any,
    next: NextFunction,
    provider: LLMProvider
  ) => this.llmHandler(req, res, next, provider, this.cheshirePreprocessor, 'cheshirecat');

  public handleAnalisiCommentiRequest = (
    req: any,
    res: any,
    next: NextFunction,
    provider: LLMProvider
  ) => this.llmHandler(req, res, next, provider, this.analisiCommentiPreprocessor, 'analisicommenti');

  public handleCommonRequest = (
    req: any,
    res: any,
    next: NextFunction,
    provider: LLMProvider
  ) => this.llmHandler(
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

  /**
   * 
  
  //
  // Preprocessori specifici per ciascun contesto
  //
  Hanno lo scopo di preparare la request prima di essere eseguite.
  Agiscono sul protocollo http allo stesso modo con cui si comportano gli interceptor in springboot tanto per capirsi.
   */

  /**
   * Preprocessore per clickbaitscore (scraping + decode + set parametri)
  
   Prima di essere inviato al modello llm vengono fatte operazioni preliminari.
   In questa versione llm , non essendoci un agente, vengono eseguite le operazioni di decodifica base 64 dell'uri
   e successivamente l'esecuzione della funzione scrape, per poi modellare i parametri request con la question direttamente iniettata nel prompt di input.
  
  Nel preprocessore dell'agente l'unica operazione che esegue il preprocessore è la decodifica dell'url.
  Il resto delle operazioni consistenti nel eseguire il tool scrape e preparare la domanda, è delegato all'agente associato a questo system prompt.
  
  In modo customizzato si possono impostare dei preprocessori che preparano i dati di input per essere inviati a un llm o un agente.
  
  Si reitera per qualsiasi altro tipo di caso d'uso
  
   * @param req 
   */
  private clickbaitPreprocessor: Preprocessor = async (req) => {
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
  private cheshirePreprocessor: Preprocessor = async (req) => {
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
  private analisiCommentiPreprocessor: Preprocessor = async (req) => {
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
}

export const llmController = LLMController.getInstance();