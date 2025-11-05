import express from "express";
const router = express.Router();
import { handleCloudLLMRequest,handleLocalOllamaRequest,handleLocalRequest } from '../controllers/handlers/analisicommenti.handlers.controller.js'

/**
 * La classe rappresenta l'endpoint della feature analisicommenti.
 
 */

// Endpoint POST per accettare un URL e chiamare lo scraper
router.post('/features/analisicommenti/local', handleLocalRequest);

router.post('/features/analisicommenti/cloud', handleCloudLLMRequest);

router.post('/features/analisicommenti/ollama', handleLocalOllamaRequest);

console.log(`Api per l'analisi dei commenti caricato con successo!`);

export default router;