import express from "express";
const router = express.Router();
import { LLMProvider } from "../../core/models/llmprovider.enum.js";
import '../logger.backend.js';
import { handleCyberSecurityAgent } from "../handlers/agents/handler.js";

/**
 * La classe rappresenta l'endpoint della feature clickbaitscore.
 
 */

// Endpoint POST per accettare un URL e chiamare lo scraper
router.post('/features/'+LLMProvider.OpenAILocal+'/threatintel/', (req, res, next) =>
  handleCyberSecurityAgent(req, res, next, LLMProvider.OpenAILocal)
);

router.post('/features/'+LLMProvider.OpenAICloud+'/threatintel', (req, res, next) =>
  handleCyberSecurityAgent(req, res, next, LLMProvider.OpenAICloud)
);

router.post('/features/'+LLMProvider.ChatOllama+'/threatintel', (req, res, next) =>
  handleCyberSecurityAgent(req, res, next, LLMProvider.ChatOllama)
);

console.log(`Api del threatintel caricati con successo!`);

export default router;