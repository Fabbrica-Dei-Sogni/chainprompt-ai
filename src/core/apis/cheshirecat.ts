
/**
 * La classe rappresenta l'insieme di endpoint per interagire con i server llm tramite il middleware di langchain
 */
import express from "express";
const router = express.Router();
import { contextFolder, ENDPOINT_CHATGENERICA } from '../services/common.services.js';
import fs from 'fs';
import { providerRoutes } from "../models/llmprovider.enum.js";
import { handleCheshireRequest } from "../handlers/llms/handler.js";
import '../../logger.js';

const contexts = fs.readdirSync(contextFolder);

/**
 * I metodi seguenti sono un tentativo di generalizzare l'esposizione di endpoint api in base ai prompt tematici definiti in opportune folder di sistema.
 * E' un esempio di dinamismo, seguendo le best practise il tentativo è rendere tale dinamismo piu in linea con le esigenze applicative future, attualmente l'obiettivo è esporre una chatbot tematica
 */
console.log(">>> Caricamento chat tematiche per essere interrogate da cheshire cat ai...");
providerRoutes.forEach(({ prefix, provider }) => {
  contexts.forEach(context => {
    console.log(prefix +"-"+context);
    router.post(`/cheshirecat/${prefix}/prompt/${context}`, (req, res, next) =>
      handleCheshireRequest(req, res, next, provider)
    );
  });
  router.post(`/cheshirecat/${prefix}/prompt/${ENDPOINT_CHATGENERICA}`, (req, res, next) =>
    handleCheshireRequest(req, res, next, provider)
  );
});


export default router;