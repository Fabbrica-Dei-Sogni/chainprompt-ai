
/**
 * La classe rappresenta l'insieme di endpoint per interagire con i server llm tramite il middleware di langchain
 */
import { handlePrompt } from './common.handler.js'
import { getAndSendPrompt } from '../controllers/business.controller.js'
import { removeCheshireCatText } from "../agents/cheshire.agent.js";
import { LLMProvider } from '../models/llmprovider.enum.js';

async function submitAgentAction(req: any, next: any, getSendPromptCallback: any) {
    const originalUriTokens = req.originalUrl.split('/');
    const contextchat = originalUriTokens[originalUriTokens.length - 1];

    //migliorare il passaggio di parametri
    req.body.noappendchat = true;

    req.body.text = removeCheshireCatText(req.body.text);
    let answer = await handlePrompt(req, contextchat, getSendPromptCallback);
    return answer;
}

export const handleLLMRequest = async (
    req: any,
    res: any,
    next: any,    
    provider: LLMProvider
) => {
    try {
        // Usa la funzione generica getAndSendPrompt basata sulla enum provider
        const answer = await submitAgentAction(
            req,
            next,
            async (inputData: any, systemPrompt: string) =>
                getAndSendPrompt(provider, inputData, systemPrompt)
        );

        res.json(answer);
    } catch (error) {
        console.error('Errore durante la conversazione con cheshire cat:', error);
        res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
};

