import { handlePrompt } from './common.handler.js'
import { getAndSendPrompt } from '../controllers/business.controller.js'
import { scrapeArticle,decodeBase64 } from "../agents/clickbaitscore.agent.js";
import { LLMProvider } from '../models/llmprovider.enum.js';

async function submitAgentAction(url: any, req: any, next: any, sendPromptLLMCallback: any) {
    const decodedUri = decodeBase64(url);

    const { title, content } = await scrapeArticle(decodedUri);
    req.body.question = `<TITOLO>${title}</TITOLO>\n<ARTICOLO>${content}</ARTICOLO>\n`;
    //si definiscono i default sul maxtoken e numCtx per il clickbaitscore
    req.body.numCtx = !req.body.numCtx ? 2040 : req.body.numCtx;
    req.body.maxToken = !req.body.maxToken ? 8032 : req.body.maxToken;
    req.body.noappendchat = true;

    let answer = await handlePrompt(req, 'clickbaitscore', sendPromptLLMCallback);
    return answer;
}

export const handleLLMRequest = async (
  req: any,
  res: any,
  next: any,
  provider: LLMProvider
) => {
    try {
      
    //XXX: parametro specifico per il clickbaitscore
    const { url } = req.body;
    // Verifica se l'URL è stato fornito
    if (!url) {
        return res.status(400).json({ error: 'URL mancante' });
    }
    //--------------------------------------
        
    // Usa la funzione generica getAndSendPrompt basata sulla enum provider
    const answer = await submitAgentAction(
      req,
      res,
      next,
      async (inputData: any, systemPrompt: string) =>
        getAndSendPrompt(provider, inputData, systemPrompt)
    );

    res.json(answer);
  } catch (error) {
    res.status(500).json({ error: "Errore durante lo scraping" });
  }
};
