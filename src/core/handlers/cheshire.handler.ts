
/**
 * La classe rappresenta l'insieme di endpoint per interagire con i server llm tramite il middleware di langchain
 */
import { handlePrompt } from './common.handler.js'
import { getAndSendPromptCloudLLM, getAndSendPromptLocalLLM, getAndSendPromptbyOllamaLLM } from '../controllers/business.controller.js'
import { removeCheshireCatText } from "../agents/cheshire.agent.js";

async function submitAgentAction(req: any, getSendPromptCallback: any) {
        const originalUriTokens = req.originalUrl.split('/');
        const contextchat = originalUriTokens[originalUriTokens.length - 1];

        //migliorare il passaggio di parametri
        req.body.noappendchat = true;

        req.body.text = removeCheshireCatText(req.body.text);
        let answer = await handlePrompt(req, contextchat, getSendPromptCallback);
        return answer;
    }
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
        let answer = await submitAgentAction(req, getSendPromptCallback);
        //const inputData: DataRequest = extractDataFromRequest(req, contextchat);
        //let answer = await wrapperServerLLM(inputData, contextchat, getSendPromptCallback);
        res.json(answer);
    } catch (err) {
        console.error('Errore durante la conversazione:', err);
        res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
};

export {
    handleLocalRequest, handleCloudLLMRequest, handleLocalOllamaRequest
};
