import express from "express";
import { scrapeArticle } from "../controllers/clickbaitscore.controller.js";
const router = express.Router();
import { handlePrompt } from '../controllers/handlers.controller.js'
import { getAndSendPromptCloudLLM, getAndSendPromptLocalLLM, getAndSendPromptbyOllamaLLM, } from '../controllers/businesscontroller.js'

/**
 * La classe rappresenta l'endpoint della feature clickbaitscore.
 
 */

// Endpoint POST per accettare un URL e chiamare lo scraper
router.post('/features/clickbaitscore/local', async (req: any, res: any, next: any) => {
    await performScrapeToLLM(req, res, next, getAndSendPromptLocalLLM);
});

router.post('/features/clickbaitscore/cloud', async (req: any, res: any, next: any) => {
    await performScrapeToLLM(req, res, next, getAndSendPromptCloudLLM);
});

router.post('/features/clickbaitscore/ollama', async (req: any, res: any, next: any) => {
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

        const { title, content } = await scrapeArticle(decodedUri);
        const jsonString = JSON.stringify({ title, content });
        req.body.question = jsonString;
        //si definiscono i default sul maxtoken e numCtx per il clickbaitscore
        req.body.numCtx = !req.body.numCtx ? 2040 : req.body.numCtx;
        req.body.maxToken = !req.body.maxToken ? 8032 : req.body.maxToken;

        let answer = await handlePrompt(req, 'clickbaitscore', sendPromptLLMCallback);

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

console.log(`Api del clickbaitscore caricati con successo!`);

export default router;