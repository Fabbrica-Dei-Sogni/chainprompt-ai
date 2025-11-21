import express from "express";
const router = express.Router();
import { LLMProvider } from "../../../core/enums/llmprovider.enum.js";
import '../../logger.backend.js';
import { AgentController } from "../../controllers/handlers/handler.agent.controller.js";
import { getComponent } from "../../di/container.js";
import { LLMController } from "../../controllers/handlers/handler.llm.controller.js";
const agentController = getComponent(AgentController);
const llmController = getComponent(LLMController);
/**
 * La classe rappresenta l'endpoint della feature clickbaitscore.
 
 */

// Endpoint POST per accettare un URL e chiamare lo scraper
router.post('/features/' + LLMProvider.OpenAILocal + '/clickbaitscore', (req, res, next) =>
  llmController.handleClickbaitRequest(req, res, next, LLMProvider.OpenAILocal)
);

router.post('/features/' + LLMProvider.OpenAICloud + '/clickbaitscore/', (req, res, next) =>
  llmController.handleClickbaitRequest(req, res, next, LLMProvider.OpenAICloud)
);

router.post('/features/' + LLMProvider.Ollama + '/clickbaitscore/', (req, res, next) =>
  llmController.handleClickbaitRequest(req, res, next, LLMProvider.Ollama)
);

router.post('/agent/features/' + LLMProvider.OpenAILocal + '/clickbaitscore', (req, res, next) =>
  agentController.handleClickbaitAgent(req, res, next, LLMProvider.OpenAILocal)
);

router.post('/agent/features/' + LLMProvider.OpenAICloud + '/clickbaitscore', (req, res, next) =>
  agentController.handleClickbaitAgent(req, res, next, LLMProvider.OpenAICloud)
);

router.post('/agent/features/' + LLMProvider.ChatOllama + '/clickbaitscore', (req, res, next) =>
  agentController.handleClickbaitAgent(req, res, next, LLMProvider.ChatOllama)
);

console.log(`Api del clickbaitscore caricati con successo!`);

export default router;