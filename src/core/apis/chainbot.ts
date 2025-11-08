
/**
 * La classe rappresenta l'insieme di endpoint per interagire con i server llm tramite il middleware di langchain
 */
import express from "express";
const router = express.Router();
import { contextFolder, ENDPOINT_CHATGENERICA } from '../services/common.services.js';
import fs from 'fs';
import { providerRoutes } from "../routes/provider.routes.js";
import { handleCommonRequest } from "../handlers/preprocessor.handler.js";
const contexts = fs.readdirSync(contextFolder);
import '../../logger.js';
/**
 * I metodi seguenti sono un tentativo di generalizzare l'esposizione di endpoint api in base ai prompt tematici definiti in opportune folder di sistema.
 * E' un esempio di dinamismo, seguendo le best practise il tentativo è rendere tale dinamismo piu in linea con le esigenze applicative future, attualmente l'obiettivo è esporre una chatbot tematica
 */
console.log(">>> Caricamento chat tematiche...");

//log solo dei contesti tematici alla prima iterazione dei provider
const allContext: Record<string, boolean> = {};

// Per ogni provider e suo prefisso, genera le route dinamiche usando l'handler generico
providerRoutes.forEach(({ prefix, provider }) => {
  contexts.forEach(context => {
    let route = `/langchain/${prefix}/prompt/${context}`;
    if (!allContext[context]) {
      console.log(context);   // Logga solo alla prima occorrenza
      allContext[context] = true;
    }
    router.post(route, (req, res, next) =>
      handleCommonRequest(req, res, next, provider)
    );
  });
  let genericRoute = `/langchain/${prefix}/prompt/${ENDPOINT_CHATGENERICA}`;
  if (!allContext[ENDPOINT_CHATGENERICA]) {
    console.log(ENDPOINT_CHATGENERICA);  // Logga solo alla prima occorrenza
    allContext[ENDPOINT_CHATGENERICA] = true;
  }
  router.post(genericRoute, (req, res, next) =>
    handleCommonRequest(req, res, next, provider)
  );
});

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