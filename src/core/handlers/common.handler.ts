
import { handle } from '../services/handlerchain.service.js';
import { getAndSendPromptCloudLLM, getAndSendPromptLocalLLM, getAndSendPromptbyOllamaLLM } from '../controllers/business.controller.js'
import * as requestIp from 'request-ip';

/**
 * La classe rappresenta l'handler prompt comune a tutte le apis qui implementate. 
 questa tecnica vuole essere scalabile per introdurre features che utilizzano un llm per svolgere varie cose.

  La callback getSendPromptCallback istruisce il provider llm da utilizzare per inviare il prompt, in base a quelle supportate dal business controller.
    getAndSendPromptLocalLLM getAndSendPromptCloudLLM getAndSendPromptbyOllamaLLM

 */
export const handlePrompt = async (req: any, contextchat: any, getSendPromptCallback: any): Promise<any> => {
    try {
        //        const originalUriTokens = req.originalUrl.split('/');
        //        const contextchat = originalUriTokens[originalUriTokens.length - 1];
        const ipAddress = requestIp.getClientIp(req);
        return handle(ipAddress, req.body, contextchat, getSendPromptCallback);
    } catch (err) {
        console.error('Errore durante la conversazione:', err);
        throw err;
        //res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
};

/*
 Funzioni handle per gestire la richiesta del prompt per un determinato contesto che sia locale come llmstudio, cloud come chatgpt o claude di antrophic tramite la apikey, oppure tramite server seamless come ollama
*/
export const handleLocalRequest = async (req: any, res: any, next: any) => {
    await handleRequest(req, res, next, getAndSendPromptLocalLLM);
};

export const handleCloudLLMRequest = async (req: any, res: any, next: any) => {
    await handleRequest(req, res, next, getAndSendPromptCloudLLM);
};

export const handleLocalOllamaRequest = async (req: any, res: any, next: any) => {
    await handleRequest(req, res, next, getAndSendPromptbyOllamaLLM);
};

async function handleRequest(req: any, res: any, next: any, sendPromptLLMCallback: any) {

    try {
        // Rispondi con il risultato dello scraping
        // Chiama lo scraper per l'URL fornito
        let answer = await submitAgentAction(req, res, next, sendPromptLLMCallback);

        // Rispondi con il risultato dello scraping
        res.json(answer);
    } catch (error) {
        res.status(500).json({ error: 'Errore durante una conversazione common' });
    }
}

const submitAgentAction = async (req: any, res: any, next: any, getSendPromptCallback: any) => {
    try {
        const originalUriTokens = req.originalUrl.split('/');
        const contextchat = originalUriTokens[originalUriTokens.length - 1];
        let answer = await handlePrompt(req, contextchat, getSendPromptCallback);
        res.json(answer);
    } catch (err) {
        console.error('Errore durante la conversazione:', err);
        res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
};

