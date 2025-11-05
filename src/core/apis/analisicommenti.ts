import express from "express";
const router = express.Router();
import { handlePrompt } from '../controllers/handlers/handlers.controller.js'
import { getAndSendPromptCloudLLM, getAndSendPromptLocalLLM, getAndSendPromptbyOllamaLLM, } from '../controllers/commons/businesscontroller.js'
import { YouTubeComment, formatCommentsForPrompt } from "../controllers/agents/analisicommenti.controller.js";
import { performScrapeToLLM } from '../controllers/handlers/analisicommenti.handlers.controller.js';

/**
 * La classe rappresenta l'endpoint della feature analisicommenti.
 
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

console.log(`Api per l'analisi dei commenti caricato con successo!`);

export default router;