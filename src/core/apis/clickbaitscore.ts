import express from "express";
const router = express.Router();
import { LLMProvider } from "../models/llmprovider.enum.js";
import { handleClickbaitRequest } from "../handlers/llms/handler.js";
import '../../logger.js';
import { handleClickbaitAgent } from "../handlers/agents/handler.js";

/**
 * La classe rappresenta l'endpoint della feature clickbaitscore.
 
 */

// Endpoint POST per accettare un URL e chiamare lo scraper
router.post('/features/localai/clickbaitscore', (req, res, next) =>
  handleClickbaitRequest(req, res, next, LLMProvider.OpenAILocal)
);

router.post('/features/cloud/clickbaitscore/', (req, res, next) =>
  handleClickbaitRequest(req, res, next, LLMProvider.OpenAICloud)
);

router.post('/features/ollama/clickbaitscore/', (req, res, next) =>
  handleClickbaitRequest(req, res, next, LLMProvider.Ollama)
);

router.post('/agent/features/localai/clickbaitscore', (req, res, next) =>
  handleClickbaitAgent(req, res, next, LLMProvider.OpenAILocal)
);

router.post('/agent/features/cloud/clickbaitscore', (req, res, next) =>
  handleClickbaitAgent(req, res, next, LLMProvider.OpenAICloud)
);

router.post('/agent/features/chatollama/clickbaitscore', (req, res, next) =>
  handleClickbaitAgent(req, res, next, LLMProvider.ChatOllama)
);

console.log(`Api del clickbaitscore caricati con successo!`);

export default router;