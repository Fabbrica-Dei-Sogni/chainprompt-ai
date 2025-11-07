import express from "express";
const router = express.Router();
import { handleLLMRequest } from '../handlers/clickbaitscore.handler.js'
import { LLMProvider } from "../models/llmprovider.enum.js";

/**
 * La classe rappresenta l'endpoint della feature clickbaitscore.
 
 */

// Endpoint POST per accettare un URL e chiamare lo scraper
router.post('/features/clickbaitscore/localai', (req, res, next) =>
  handleLLMRequest(req, res, next, LLMProvider.OpenAILocal)
);

router.post('/features/clickbaitscore/cloud', (req, res, next) =>
  handleLLMRequest(req, res, next, LLMProvider.OpenAICloud)
);

router.post('/features/clickbaitscore/ollama', (req, res, next) =>
  handleLLMRequest(req, res, next, LLMProvider.Ollama)
);

console.log(`Api del clickbaitscore caricati con successo!`);

export default router;