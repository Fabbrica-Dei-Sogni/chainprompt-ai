import express from "express";
const router = express.Router();
import { handleCloudLLMRequest, handleLocalOllamaRequest, handleLocalRequest } from '../controllers/handlers/handlers.controller.js'

/**
 * La classe rappresenta l'endpoint della feature clickbaitscore.
 
 */

// Endpoint POST per accettare un URL e chiamare lo scraper
router.post('/features/clickbaitscore/localai', handleLocalRequest);

router.post('/features/clickbaitscore/cloud', handleCloudLLMRequest);

router.post('/features/clickbaitscore/ollama', handleLocalOllamaRequest);

console.log(`Api del clickbaitscore caricati con successo!`);

export default router;