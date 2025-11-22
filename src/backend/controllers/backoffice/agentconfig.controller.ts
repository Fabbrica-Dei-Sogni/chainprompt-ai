/**
 * Controller per la gestione degli AgentConfig
 * Contiene la logica business per le operazioni CRUD sugli agenti
 */
import { Request, Response } from "express";
import { agentConfigService } from "../../services/databases/mongodb/services/agentconfig.service.js";
import { CreateAgentConfigDTO } from "../../dto/createagentconfig.dto.js";
import { inject, injectable } from "tsyringe";
import { LOGGER_TOKEN } from "../../../core/di/tokens.js";
import { Logger } from "winston";
import { asyncHandler } from "../../middleware/async-handler.middleware.js";
import { NotFoundError, ValidationError } from "../../errors/custom-errors.js";

//export class AgentConfigController {
@injectable()
export class AgentConfigController {
    constructor(
        @inject(LOGGER_TOKEN) private readonly logger: Logger
    ) { }
    /**
     * Lista tutti gli agenti configurati
     */
    /**
     * Lista tutti gli agenti configurati
     */
    getAllAgents = asyncHandler(async (req: Request, res: Response) => {
        this.logger.info("[AgentConfigController] getAllAgents - Recupero lista agenti");
        const agents = await agentConfigService.findAll();
        res.status(200).json(agents);
    });

    /**
     * Ricerca agenti per nome (case-insensitive)
     */
    searchAgentsByName = asyncHandler(async (req: Request, res: Response) => {
        const { nome } = req.query;

        // Validazione input
        if (!nome || typeof nome !== 'string') {
            throw new ValidationError("Parametro 'nome' richiesto nella query string", { nome: "Required and must be a string" });
        }

        this.logger.info(`[AgentConfigController] searchAgentsByName - Ricerca: ${nome}`);

        // Ricerca con regex case-insensitive
        const agents = await agentConfigService.findAll({
            nome: { $regex: nome, $options: 'i' }
        });

        res.status(200).json(agents);
    });

    /**
     * Recupera dettaglio agente per ID
     */
    getAgentById = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        this.logger.info(`[AgentConfigController] getAgentById - ID: ${id}`);

        const agent = await agentConfigService.findById(id);

        if (!agent) {
            throw new NotFoundError("Agente", id);
        }

        res.status(200).json(agent);
    });

    /**
     * Crea nuovo agente
     */
    createAgent = asyncHandler(async (req: Request, res: Response) => {
        this.logger.info("[AgentConfigController] createAgent - Creazione nuovo agente");

        const data: CreateAgentConfigDTO = req.body;

        // Validazione campi required
        if (!data.contesto || !data.profilo || !data.promptFrameworkRef) {
            const fields: Record<string, string> = {};
            if (!data.contesto) fields.contesto = "Required";
            if (!data.profilo) fields.profilo = "Required";
            if (!data.promptFrameworkRef) fields.promptFrameworkRef = "Required";

            throw new ValidationError("Campi 'contesto', 'profilo' e 'promptFrameworkRef' sono obbligatori", fields);
        }

        const newAgent = await agentConfigService.create(data);

        this.logger.info(`[AgentConfigController] createAgent - Agente creato con ID: ${newAgent._id}`);
        res.status(201).json(newAgent);
    });

    /**
     * Aggiorna agente esistente
     */
    updateAgent = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        this.logger.info(`[AgentConfigController] updateAgent - ID: ${id}`);

        const updateData = { ...req.body };

        // Rimuovi campi che non dovrebbero essere aggiornati direttamente
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        const updatedAgent = await agentConfigService.updateById(id, updateData);

        if (!updatedAgent) {
            throw new NotFoundError("Agente", id);
        }

        this.logger.info(`[AgentConfigController] updateAgent - Agente aggiornato: ${id}`);
        res.status(200).json(updatedAgent);
    });

    /**
     * Elimina agente
     */
    deleteAgent = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        this.logger.info(`[AgentConfigController] deleteAgent - ID: ${id}`);

        const deleted = await agentConfigService.deleteById(id);

        if (!deleted) {
            throw new NotFoundError("Agente", id);
        }

        this.logger.info(`[AgentConfigController] deleteAgent - Agente eliminato: ${id}`);
        res.status(200).json({ success: true, id });
    });
}
