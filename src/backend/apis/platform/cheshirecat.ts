
/**
 * La classe rappresenta l'insieme di endpoint per interagire con i server llm tramite il middleware di langchain
 */
import express from "express";
const router = express.Router();
import fs from 'fs';
import { providerRoutes } from "../../../core/enums/llmprovider.enum.js";
import { llmController } from "../../controllers/handler.llm.controller.js";
import '../../logger.backend.js';
import { contextFolder, ENDPOINT_CHATGENERICA } from "../../services/common.service.js";

const contexts = fs.readdirSync(contextFolder);

/**
 * I metodi seguenti sono un tentativo di generalizzare l'esposizione di endpoint api in base ai prompt tematici definiti in opportune folder di sistema.
 * E' un esempio di dinamismo, seguendo le best practise il tentativo è rendere tale dinamismo piu in linea con le esigenze applicative future, attualmente l'obiettivo è esporre una chatbot tematica
 */
console.log(">>> Caricamento chat tematiche per essere interrogate da cheshire cat ai...");
providerRoutes.forEach(({ prefix, provider }) => {
  contexts.forEach(context => {
    console.log(prefix + "-" + context);
    router.post(`/cheshirecat/${prefix}/prompt/${context}`, (req, res, next) =>
      llmController.handleCheshireRequest(req, res, next, provider)
    );
  });
  router.post(`/cheshirecat/${prefix}/prompt/${ENDPOINT_CHATGENERICA}`, (req, res, next) =>
    llmController.handleCheshireRequest(req, res, next, provider)
  );
});


export default router;