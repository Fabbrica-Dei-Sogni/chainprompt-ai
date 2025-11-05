import express from "express";
import { scrapeArticle } from "../agents/clickbaitscore.controller.js";
const router = express.Router();
import { handlePrompt } from './handlers.controller.js'
import { getAndSendPromptCloudLLM, getAndSendPromptLocalLLM, getAndSendPromptbyOllamaLLM, } from '../commons/businesscontroller.js'

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
        const decodedUri = decodeBase64(url);

        const { title, content } = await scrapeArticle(decodedUri);
        req.body.question = `<TITOLO>${title}</TITOLO>\n<ARTICOLO>${content}</ARTICOLO>\n`;
        //si definiscono i default sul maxtoken e numCtx per il clickbaitscore
        req.body.numCtx = !req.body.numCtx ? 2040 : req.body.numCtx;
        req.body.maxToken = !req.body.maxToken ? 8032 : req.body.maxToken;
        req.body.noappendchat = true;

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

export {
    handleLocalRequest, handleCloudLLMRequest, handleLocalOllamaRequest
};