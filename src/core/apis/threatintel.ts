import express from "express";
const router = express.Router();
import { LLMProvider } from "../models/llmprovider.enum.js";
import { handleCyberSecurityAgent } from "../handlers/preprocessor.handler.js";
import '../../logger.js';

/**
 * La classe rappresenta l'endpoint della feature clickbaitscore.
 
 */

// Endpoint POST per accettare un URL e chiamare lo scraper
router.post('/features/threatintel/localai', (req, res, next) =>
  handleCyberSecurityAgent(req, res, next, LLMProvider.OpenAILocal)
);

router.post('/features/threatintel/cloud', (req, res, next) =>
  handleCyberSecurityAgent(req, res, next, LLMProvider.OpenAICloud)
);

router.post('/features/threatintel/ollama', (req, res, next) =>
  handleCyberSecurityAgent(req, res, next, LLMProvider.Ollama)
);

console.log(`Api del threatintel caricati con successo!`);

export default router;