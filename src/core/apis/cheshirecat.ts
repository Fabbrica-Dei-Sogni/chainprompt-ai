
/**
 * La classe rappresenta l'insieme di endpoint per interagire con i server llm tramite il middleware di langchain
 */
import express from "express";
const router = express.Router();
import { contextFolder, ENDPOINT_CHATGENERICA } from '../services/commonservices.js';
import { getAndSendPromptCloudLLM, getAndSendPromptLocalLLM, getAndSendPromptbyOllamaLLM } from '../controllers/businesscontroller.js'
import { handlePrompt } from '../controllers/handlers.controller.js'
import fs from 'fs';
const contexts = fs.readdirSync(contextFolder);

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

        let answer = await handlePrompt(req, contextchat, getSendPromptCallback);
        //const inputData: DataRequest = extractDataFromRequest(req, contextchat);
        //let answer = await wrapperServerLLM(inputData, contextchat, getSendPromptCallback);
        res.json(answer);
    } catch (err) {
        console.error('Errore durante la conversazione:', err);
        res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
};

/**
 * I metodi seguenti sono un tentativo di generalizzare l'esposizione di endpoint api in base ai prompt tematici definiti in opportune folder di sistema.
 * E' un esempio di dinamismo, seguendo le best practise il tentativo è rendere tale dinamismo piu in linea con le esigenze applicative future, attualmente l'obiettivo è esporre una chatbot tematica
 */
console.log(">>> Caricamento chat tematiche per essere interrogate da cheshire cat ai...");
contexts.forEach(context => {
    console.log(context)
});
// Genera le route dinamicamente per ogni contesto disponibile
contexts.forEach(context => {
    router.post(`/cheshirecat/localai/prompt/${context}`, handleLocalRequest);
});
router.post(`/cheshirecat/localai/prompt/${ENDPOINT_CHATGENERICA}`, handleLocalRequest);

// Genera le route dinamicamente per ogni contesto disponibile
contexts.forEach(context => {
    router.post(`/cheshirecat/cloud/prompt/${context}`, handleCloudLLMRequest);
});
router.post(`/cheshirecat/cloud/prompt/${ENDPOINT_CHATGENERICA}`, handleCloudLLMRequest);

contexts.forEach(context => {
    router.post(`/cheshirecat/ollama/prompt/${context}`, handleLocalOllamaRequest);
});
router.post(`/cheshirecat/ollama/prompt/${ENDPOINT_CHATGENERICA}`, handleLocalOllamaRequest);


export default router;