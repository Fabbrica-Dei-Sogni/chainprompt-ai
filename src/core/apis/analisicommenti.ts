import express from "express";
const router = express.Router();
import { handlePrompt } from '../controllers/handlers.controller.js'
import { getAndSendPromptCloudLLM, getAndSendPromptLocalLLM, getAndSendPromptbyOllamaLLM, } from '../controllers/businesscontroller.js'
import { scrapeCommentsYouTube, YouTubeComment } from "../controllers/analisicommenticontroller.js";

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

    const { url } = req.body;
    // Verifica se l'URL è stato fornito
    if (!url) {
        return res.status(400).json({ error: 'URL mancante' });
    }

    try {
        // Rispondi con il risultato dello scraping
        // Chiama lo scraper per l'URL fornito
        const decodedUri = decodeBase64(url);

        const comments: YouTubeComment[] = await scrapeCommentsYouTube(decodedUri);

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
        res.status(500).json({ error: 'Errore durante lo scraping' });
    }
}

// Funzione per decodificare la stringa base64
function decodeBase64(base64: string): string {
    const buffer = Buffer.from(base64, 'base64');
    return buffer.toString('utf-8');
}

// Funzione di formattazione avanzata
function formatCommentsForPrompt(comments: YouTubeComment[]): string {
    let prompt = "=== INIZIO COMMENTI YOUTUBE ===\n\n";

    comments.forEach((comment, index) => {
        prompt += `[COMMENT #${index + 1}]\n` +
            `Autore: ${comment.author}\n` +
            `Contenuto: ${comment.content}\n` +
            `Like: ${comment.likes || "N/A"}\n` +
            `Data: ${comment.timestamp}\n` +
            `Risposte: ${comment.repliesCount}\n` +
            "-----------------------------\n\n";
    });

    prompt += "=== FINE COMMENTI YOUTUBE ===";
    return prompt;
}

console.log(`Api del clickbaitscore caricati con successo!`);

export default router;