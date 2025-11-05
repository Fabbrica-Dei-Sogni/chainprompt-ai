import express from "express";
import { submitAgentAction } from "../controllers/clickbaitscore.controller.js";
const router = express.Router();
import { getAndSendPromptCloudLLM, getAndSendPromptLocalLLM, getAndSendPromptbyOllamaLLM, } from '../controllers/business.controller.js'

const handleLocalRequest = async (req: any, res: any, next: any) => {
    await handleRequest(req, res, next, getAndSendPromptLocalLLM);
};

const handleCloudLLMRequest = async (req: any, res: any, next: any) => {
    await handleRequest(req, res, next, getAndSendPromptCloudLLM);
};

const handleLocalOllamaRequest = async (req: any, res: any, next: any) => {
    await handleRequest(req, res, next, getAndSendPromptbyOllamaLLM);
};

async function handleRequest(req: any, res: any, next: any, sendPromptLLMCallback: any) {

    const { url } = req.body;
    // Verifica se l'URL è stato fornito
    if (!url) {
        return res.status(400).json({ error: 'URL mancante' });
    }

    try {
        // Rispondi con il risultato dello scraping
        // Chiama lo scraper per l'URL fornito
        let answer = await submitAgentAction(url, req, sendPromptLLMCallback);

        // Rispondi con il risultato dello scraping
        res.json(answer);
    } catch (error) {
        res.status(500).json({ error: 'Errore durante lo scraping' });
    }
}

export {
    handleLocalRequest, handleCloudLLMRequest, handleLocalOllamaRequest
};