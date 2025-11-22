// MUST BE FIRST: reflect-metadata for TSyringe DI
import "reflect-metadata";
// Bootstrap DI container (side-effect import)
import "../backend/di/container.js";

import express from 'express';
import bodyParser from 'body-parser';
import * as http from 'http';
import cors from 'cors';
import { setGlobalDispatcher, Agent } from 'undici';
import dotenv from "dotenv";
import api from './endpoint.js';
import { logger } from './logger.backend.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware.js';


dotenv.config();
//XXX: questa istruzione crea un agente dispatcher per il gestore delle richieste undici usato da node.js
//l'obiettivo e' impostare a livello globale un agente che istruisce qualsiasi fetch under the wood l'ecosistema langchain a non terminare mai la richiesta per una mancata ricezione di un header
//per lunghe richieste a un llm come ollama, puo accadere che venga generato l'errore UND_ERR_HEADERS_TIMEOUT
//per evitare questo errore , si imposta un Agente con il parametro headersTimeout a 0 , consentendo un'attesa anche molto lunga di una richiesta llm 
const agent = new Agent({
    headersTimeout: Number(process.env.HEADER_TIMEOUT_UNDICI!) // Imposta il timeout delle intestazioni a infinito
});
setGlobalDispatcher(agent);

const app: express.Application = express();

const port: number = parseInt(process.env.PORT || '3000'); // Usa il valore della variabile di ambiente PORT, se definita, altrimenti usa la porta 3000
const nameAssistant: string = process.env.NAME_ASSISTANT || "Chainprompt AI";

app.use(cors());

// Parsers for POST data
const bodyLimit = process.env.BODY_LIMIT || '10mb';
app.use(bodyParser.json({ limit: bodyLimit }));
app.use(bodyParser.urlencoded({ limit: bodyLimit, extended: false }));

const apiversion = "/api/v1";
console.log(`Versione api rest : ${apiversion}`);
app.use(apiversion, api);

// 404 Handler - Deve essere dopo le route API
app.use(notFoundHandler);

// Global Error Handler - Deve essere l'ultimo middleware
app.use(errorHandler(logger));

const server: http.Server = http.createServer(app);

server.listen(port, () => { console.log(`Il server ${nameAssistant} avviato con successo sulla porta:${port}`); });

