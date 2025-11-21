/**
 * REST API Routes per AgentConfig
 * Definisce gli endpoint e delega la logica al controller
 */
import express from "express";
import { AgentConfigController } from "../../controllers/backoffice/agentconfig.controller.js";
import { getComponent } from "../../di/container.js";
const agentConfigController = getComponent(AgentConfigController);

const router = express.Router();

/**
 * @route   GET /config/agentconfig
 * @desc    Lista tutti gli agenti configurati
 * @access  Public
 */
router.get("/backoffice/agentconfig", (req, res, next) =>
    agentConfigController.getAllAgents(req, res)
);

/**
 * @route   GET /config/agentconfig/search
 * @desc    Ricerca agenti per nome
 * @query   nome - Nome da cercare (case-insensitive)
 * @access  Public
 */
router.get("/backoffice/agentconfig/search", (req, res, next) =>
    agentConfigController.searchAgentsByName(req, res)
);

/**
 * @route   GET /config/agentconfig/:id
 * @desc    Recupera dettaglio agente per ID
 * @access  Public
 */
router.get("/backoffice/agentconfig/:id", (req, res, next) =>
    agentConfigController.getAgentById(req, res)
);

/**
 * @route   POST /config/agentconfig
 * @desc    Crea nuovo agente
 * @access  Public
 */
router.post("/backoffice/agentconfig", (req, res, next) =>
    agentConfigController.createAgent(req, res)
);

/**
 * @route   PUT /config/agentconfig/:id
 * @desc    Aggiorna agente esistente
 * @access  Public
 */
router.put("/backoffice/agentconfig/:id", (req, res, next) =>
    agentConfigController.updateAgent(req, res)
);

/**
 * @route   DELETE /config/agentconfig/:id
 * @desc    Elimina agente
 * @access  Public
 */
router.delete("/backoffice/agentconfig/:id", (req, res, next) =>
    agentConfigController.deleteAgent(req, res)
);

console.log("✓ AgentConfig API routes loaded successfully");

export default router;
