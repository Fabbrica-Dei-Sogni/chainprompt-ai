
import { handle } from '../../services/handlerchain.service.js';
import { getAndSendPromptCloudLLM, getAndSendPromptLocalLLM, getAndSendPromptbyOllamaLLM } from '../commons/businesscontroller.js'
import * as requestIp from 'request-ip';
/**
 * La classe rappresenta l'handler prompt comune a tutte le apis qui implementate. 
 questa tecnica vuole essere scalabile per introdurre features che utilizzano un llm per svolgere varie cose.
 */
const handlePrompt = async (req: any, contextchat: any, getSendPromptCallback: any): Promise<any> => {
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
const handleLocalRequest = async (req: any, res: any, next: any) => {
    await handleRequest(req, res, next, getAndSendPromptLocalLLM);
};

const handleCloudLLMRequest = async (req: any, res: any, next: any) => {
    await handleRequest(req, res, next, getAndSendPromptCloudLLM);
};

const handleLocalOllamaRequest = async (req: any, res: any, next: any) => {
    await handleRequest(req, res, next, getAndSendPromptbyOllamaLLM);
};


const handleRequest = async (req: any, res: any, next: any, getSendPromptCallback: any) => {
    try {
        const originalUriTokens = req.originalUrl.split('/');
        const contextchat = originalUriTokens[originalUriTokens.length - 1];
        let answer = await handlePrompt(req, contextchat, getSendPromptCallback);
        //const inputData: DataRequest = extractDataFromRequest(req, contextchat);
        //let answer = await wrapperServerLLM(inputData, contextchat, getSendPromptCallback);
        res.json(answer);
    } catch (err) {
        console.error('Errore durante la conversazione:', err);
        res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
};

export {
    handlePrompt, handleLocalRequest, handleCloudLLMRequest, handleLocalOllamaRequest
};