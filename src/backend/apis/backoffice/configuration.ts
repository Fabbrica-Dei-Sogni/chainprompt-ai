/**
 * REST API Routes per Configuration
 * Definisce gli endpoint per il key-value store e delega la logica al controller
 */
import express from "express";
import { ConfigurationController } from "../../controllers/backoffice/configuration.controller.js";
import { getComponent } from "../../di/container.js";
const configurationController = getComponent(ConfigurationController);

const router = express.Router();

/**
 * @route   GET /config/configuration
 * @desc    Lista tutte le configurazioni (con ricerca opzionale)
 * @query   search - Chiave da cercare (case-insensitive)
 * @access  Public
 */
router.get("/backoffice/configuration", (req, res, next) => configurationController.getAllConfigurations(req, res, next));

/**
 * @route   GET /config/configuration/:key
 * @desc    Recupera configurazione per chiave
 * @access  Public
 */
router.get("/backoffice/configuration/:key", (req, res, next) => configurationController.getConfigByKey(req, res, next));

/**
 * @route   POST /config/configuration
 * @desc    Crea o aggiorna configurazione (upsert)
 * @body    { key: string, value: string|any }
 * @access  Public
 */
router.post("/backoffice/configuration", (req, res, next) => configurationController.saveConfiguration(req, res, next));

/**
 * @route   DELETE /config/configuration/:key
 * @desc    Elimina configurazione per chiave
 * @access  Public
 */
router.delete("/backoffice/configuration/:key", (req, res, next) => configurationController.deleteConfiguration(req, res, next));

console.log("✓ Configuration API routes loaded successfully");

export default router;
