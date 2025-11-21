import express from "express";
const router = express.Router();
import { LLMProvider } from "../../../core/enums/llmprovider.enum.js";
import '../../logger.backend.js';
import { LLMController } from "../../controllers/handlers/handler.llm.controller.js";
import { getComponent } from "../../di/container.js";
const llmController = getComponent(LLMController);


/**
 * La classe rappresenta l'endpoint della feature analisicommenti.
 
 */

// Endpoint POST per accettare un URL e chiamare lo scraper
router.post('/features/' + LLMProvider.OpenAILocal + '/analisicommenti', (req, res, next) =>
  llmController.handleAnalisiCommentiRequest(req, res, next, LLMProvider.OpenAILocal)
);

router.post('/features/' + LLMProvider.OpenAICloud + '/analisicommenti', (req, res, next) =>
  llmController.handleAnalisiCommentiRequest(req, res, next, LLMProvider.OpenAICloud)
);

router.post('/features/' + LLMProvider.Ollama + '/analisicommenti', (req, res, next) =>
  llmController.handleAnalisiCommentiRequest(req, res, next, LLMProvider.Ollama)
);

console.log(`Api per l'analisi dei commenti caricato con successo!`);

export default router;