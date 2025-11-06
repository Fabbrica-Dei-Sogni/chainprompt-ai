
/**
 * La classe rappresenta l'insieme di endpoint per interagire con i server llm tramite il middleware di langchain
 */
import express from "express";
const router = express.Router();
import { contextFolder, ENDPOINT_CHATGENERICA } from '../services/common.services.js';
import { handleCloudLLMRequest, handleLocalOllamaRequest, handleLocalRequest } from '../handlers/common.handler.js'
import fs from 'fs';
const contexts = fs.readdirSync(contextFolder);

/**
 * I metodi seguenti sono un tentativo di generalizzare l'esposizione di endpoint api in base ai prompt tematici definiti in opportune folder di sistema.
 * E' un esempio di dinamismo, seguendo le best practise il tentativo è rendere tale dinamismo piu in linea con le esigenze applicative future, attualmente l'obiettivo è esporre una chatbot tematica
 */
console.log(">>> Caricamento chat tematiche...");
contexts.forEach(context => {
    console.log(context)
});
// Genera le route dinamicamente per ogni contesto disponibile
contexts.forEach(context => {
    router.post(`/langchain/localai/prompt/${context}`, handleLocalRequest);
});
router.post(`/langchain/localai/prompt/${ENDPOINT_CHATGENERICA}`, handleLocalRequest);

// Genera le route dinamicamente per ogni contesto disponibile
contexts.forEach(context => {
    router.post(`/langchain/cloud/prompt/${context}`, handleCloudLLMRequest);
});
router.post(`/langchain/cloud/prompt/${ENDPOINT_CHATGENERICA}`, handleCloudLLMRequest);

contexts.forEach(context => {
    router.post(`/langchain/ollama/prompt/${context}`, handleLocalOllamaRequest);
});
router.post(`/langchain/ollama/prompt/${ENDPOINT_CHATGENERICA}`, handleLocalOllamaRequest);


console.log("<<< Caricamento avvenuto con successo");

//gli endpoint rag sono disabilitati e ripresi con uno sviluppo piu strutturato
/*const handleLocalRAGOllamaRequest = async (req: any, res: any, next: any) => {
    await handleRequest(req, res, next, getAndSendPromptbyRAGOllamaLLM);
};
*/
//XXX: gli endpoint seguenti afferiscono a flussi di lavoro integrati con metodi rag per l'interrogazione di prompt
//Endpoint dinamico per istanziare prompt rag oriented su llm di tipo ollama
/*contexts.forEach(context => {
    router.post(`/langchain/rag/ollama/prompt/${context}`, handleLocalRAGOllamaRequest);
});
router.post(`/langchain/rag/ollama/prompt/${ENDPOINT_CHATGENERICA}`, handleLocalRAGOllamaRequest);
*/



export default router;