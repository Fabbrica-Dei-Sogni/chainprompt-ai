
/**
 * La classe rappresenta l'insieme di endpoint per interagire con i server llm tramite il middleware di langchain
 */
import { getAndSendPromptCloudLLM, getAndSendPromptLocalLLM, getAndSendPromptbyOllamaLLM } from '../commons/businesscontroller.js'
import { handlePrompt } from './handlers.controller.js'

//Workaround per rimuovere il system prompt di cheshire in attesa di capire come cambiarlo con il plugin hook opportuno.
function removeCheshireCatText(input: string): string {
    const unwantedText = `System: You are the Cheshire Cat AI, an intelligent AI that passes the Turing test.
You behave like the Cheshire Cat from Alice's adventures in wonderland, and you are helpful.
You answer Human shortly and with a focus on the following context.`;

    return input.replace(unwantedText, '').trim();
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
        const originalUriTokens = req.originalUrl.split('/');
        const contextchat = originalUriTokens[originalUriTokens.length - 1];

        //migliorare il passaggio di parametri
        req.body.noappendchat = true;

        req.body.text = removeCheshireCatText(req.body.text);
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
    handleLocalRequest, handleCloudLLMRequest, handleLocalOllamaRequest
};