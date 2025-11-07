import express from "express";
const router = express.Router();
import { LLMProvider } from "../models/llmprovider.enum.js";
import { handleClickbaitRequest } from "../handlers/preprocessor.handler.js";

/**
 * La classe rappresenta l'endpoint della feature clickbaitscore.
 
 */

// Endpoint POST per accettare un URL e chiamare lo scraper
router.post('/features/clickbaitscore/localai', (req, res, next) =>
  handleClickbaitRequest(req, res, next, LLMProvider.OpenAILocal)
);

router.post('/features/clickbaitscore/cloud', (req, res, next) =>
  handleClickbaitRequest(req, res, next, LLMProvider.OpenAICloud)
);

router.post('/features/clickbaitscore/ollama', (req, res, next) =>
  handleClickbaitRequest(req, res, next, LLMProvider.Ollama)
);

console.log(`Api del clickbaitscore caricati con successo!`);

export default router;