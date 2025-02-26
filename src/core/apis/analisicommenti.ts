import express from "express";
const router = express.Router();
import { handlePrompt } from '../controllers/handlers.controller.js'
import { getAndSendPromptCloudLLM, getAndSendPromptLocalLLM, getAndSendPromptbyOllamaLLM, } from '../controllers/businesscontroller.js'
import { YouTubeComment, formatCommentsForPrompt } from "../controllers/analisicommenticontroller.js";

/**
 * La classe rappresenta l'endpoint della feature clickbaitscore.
 
 */

// Endpoint POST per accettare un URL e chiamare lo scraper
router.post('/features/analisicommenti/local', async (req: any, res: any, next: any) => {
    await performScrapeToLLM(req, res, next, getAndSendPromptLocalLLM);
});

router.post('/features/analisicommenti/cloud', async (req: any, res: any, next: any) => {
    await performScrapeToLLM(req, res, next, getAndSendPromptCloudLLM);
});

router.post('/features/analisicommenti/ollama', async (req: any, res: any, next: any) => {
    await performScrapeToLLM(req, res, next, getAndSendPromptbyOllamaLLM);
});

async function performScrapeToLLM(req: any, res: any, next: any, sendPromptLLMCallback: any) {

    //Parametri di input, l'uri del video you tube e l'id del commento da cui iniziare. Se non c'e l'id viene analizzato l'intera lista dei commenti principali.
    const { payload } = req.body;
    // Verifica se l'URL è stato fornito
    if (!payload) {
        return res.status(400).json({ error: 'Payload commenti mancante' });
    }

    try {
        // Rispondi con il risultato dello scraping
        // Chiama lo scraper per l'URL fornito
        //const decodeComments = safeBase64Decode(payload);
        const comments: YouTubeComment[] = payload;
        //const comments: YouTubeComment[] = idCommento != null ? await scrapeCommentBranch(decodedUri, idCommento) : await scrapeCommentsYouTube(decodedUri);

        const prompt = formatCommentsForPrompt(comments);
        //TODO: creare il prompt avendo come risultato i commenti
        req.body.question = prompt;
        //si definiscono i default sul maxtoken e numCtx per il analisicommenti
        req.body.numCtx = !req.body.numCtx ? 2040 : req.body.numCtx;
        req.body.maxToken = !req.body.maxToken ? null : req.body.maxToken;
        req.body.noappendchat = true;

        let answer = await handlePrompt(req, 'analisicommenti', sendPromptLLMCallback);

        // Rispondi con il risultato dello scraping
        res.json(answer);
    } catch (error) {
        res.status(500).json({ error: 'Errore durante l\'analisi dei commenti' });
    }
}

// Funzione per decodificare la stringa base64
function decodeBase64(base64: string): string {
    const buffer = Buffer.from(base64, 'base64');
    return buffer.toString('utf-8');
}

console.log(`Api per l'analisi dei commenti caricato con successo!`);

export default router;