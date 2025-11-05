
/**
 * La classe rappresenta l'insieme di endpoint per interagire con i server llm tramite il middleware di langchain
 */
import express from "express";
const router = express.Router();
import { contextFolder, ENDPOINT_CHATGENERICA } from '../services/commonservices.js';
import { handleCloudLLMRequest, handleLocalOllamaRequest, handleLocalRequest } from '../controllers/handlers/cheshire.handlers.controller.js'
import fs from 'fs';
const contexts = fs.readdirSync(contextFolder);

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