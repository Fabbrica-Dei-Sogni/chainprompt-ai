import express from "express";
const router = express.Router();
import { handleLLMRequest } from '../handlers/analisicommenti.handler.js'
import { LLMProvider } from "../models/llmprovider.enum.js";

/**
 * La classe rappresenta l'endpoint della feature analisicommenti.
 
 */

// Endpoint POST per accettare un URL e chiamare lo scraper
router.post('/features/analisicommenti/local', (req, res, next) =>
  handleLLMRequest(req, res, next, LLMProvider.OpenAILocal)
);

router.post('/features/analisicommenti/cloud', (req, res, next) =>
  handleLLMRequest(req, res, next, LLMProvider.OpenAICloud)
);

router.post('/features/analisicommenti/ollama', (req, res, next) =>
  handleLLMRequest(req, res, next, LLMProvider.Ollama)
);

console.log(`Api per l'analisi dei commenti caricato con successo!`);

export default router;