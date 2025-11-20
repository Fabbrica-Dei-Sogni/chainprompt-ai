/**
 * REST API Routes per Configuration
 * Definisce gli endpoint per il key-value store e delega la logica al controller
 */
import express from "express";
import { configurationController } from "../../controllers/configuration.controller.js";

const router = express.Router();

/**
 * @route   GET /config/configuration
 * @desc    Lista tutte le configurazioni (con ricerca opzionale)
 * @query   search - Chiave da cercare (case-insensitive)
 * @access  Public
 */
router.get("/backoffice/configuration", (req, res, next) =>
    configurationController.getAllConfigurations(req, res)
);

/**
 * @route   GET /config/configuration/:key
 * @desc    Recupera configurazione per chiave
 * @access  Public
 */
router.get("/backoffice/configuration/:key", (req, res, next) =>
    configurationController.getConfigByKey(req, res)
);

/**
 * @route   POST /config/configuration
 * @desc    Crea o aggiorna configurazione (upsert)
 * @body    { key: string, value: string|any }
 * @access  Public
 */
router.post("/backoffice/configuration", (req, res, next) =>
    configurationController.saveConfiguration(req, res)
);

/**
 * @route   DELETE /config/configuration/:key
 * @desc    Elimina configurazione per chiave
 * @access  Public
 */
router.delete("/backoffice/configuration/:key", (req, res, next) =>
    configurationController.deleteConfiguration(req, res)
);

console.log("✓ Configuration API routes loaded successfully");

export default router;
