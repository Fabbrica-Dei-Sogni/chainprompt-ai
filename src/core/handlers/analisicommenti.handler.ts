
import { handlePrompt } from './common.handler.js'
import { getAndSendPrompt } from '../controllers/business.controller.js'
import { formatCommentsForPrompt, YouTubeComment } from "../agents/analisicommenti.agent.js";
import { LLMProvider } from '../models/llmprovider.enum.js';


async function submitAgentAction(payload: any, req: any, next: any, sendPromptLLMCallback: any) {
    const comments: YouTubeComment[] = payload;
    //const comments: YouTubeComment[] = idCommento != null ? await scrapeCommentBranch(decodedUri, idCommento) : await scrapeCommentsYouTube(decodedUri);
    const prompt = formatCommentsForPrompt(comments);
    //TODO: creare il prompt avendo come risultato i commenti
    req.body.question = prompt;


    let answer = await handlePrompt(req, 'analisicommenti', sendPromptLLMCallback);
    return answer;
}

export const handleLLMRequest = async (
    req: any,
    res: any,
    next: any,
    provider: LLMProvider
) => {
    // Definisci i valori di default
    req.body.numCtx = req.body.numCtx ?? 2040;
    req.body.maxToken = req.body.maxToken ?? null;
    req.body.noappendchat = true;

    const { payload } = req.body;

    // Verifica payload
    if (!payload) {
        return res.status(400).json({ error: 'Payload commenti mancante' });
    }

    try {
        // Chiama submitAgentAction passando la funzione getAndSendPrompt generica con provider
        // Rispondi con il risultato dello scraping
        // Chiama lo scraper per l'URL fornito
        //const decodeComments = safeBase64Decode(payload);
        const answer = await submitAgentAction(
            payload,
            req,
            next,
            async (inputData: any, systemPrompt: string) =>
                getAndSendPrompt(provider, inputData, systemPrompt)
        );

        res.json(answer);
    } catch (error) {
        res.status(500).json({ error: "Errore durante l'analisi dei commenti" });
    }
};
