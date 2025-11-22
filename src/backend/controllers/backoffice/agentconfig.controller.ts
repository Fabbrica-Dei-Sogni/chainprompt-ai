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

//export class AgentConfigController {
@injectable()
export class AgentConfigController {
    constructor(
        @inject(LOGGER_TOKEN) private readonly logger: Logger
    ) { }
    /**
     * Lista tutti gli agenti configurati
     */
    async getAllAgents(req: Request, res: Response): Promise<void> {
        try {
            this.logger.info("[AgentConfigController] getAllAgents - Recupero lista agenti");
            const agents = await agentConfigService.findAll();
            res.status(200).json(agents);
        } catch (error: any) {
            this.logger.error(`[AgentConfigController] getAllAgents ERROR: ${error.message}`);
            res.status(500).json({
                error: "Errore nel recupero degli agenti",
                details: error.message
            });
        }
    }

    /**
     * Ricerca agenti per nome (case-insensitive)
     */
    async searchAgentsByName(req: Request, res: Response): Promise<void> {
        try {
            const { nome } = req.query;

            // Validazione input
            if (!nome || typeof nome !== 'string') {
                res.status(400).json({
                    error: "Parametro 'nome' richiesto nella query string"
                });
                return;
            }

            this.logger.info(`[AgentConfigController] searchAgentsByName - Ricerca: ${nome}`);

            // Ricerca con regex case-insensitive
            const agents = await agentConfigService.findAll({
                nome: { $regex: nome, $options: 'i' }
            });

            res.status(200).json(agents);
        } catch (error: any) {
            this.logger.error(`[AgentConfigController] searchAgentsByName ERROR: ${error.message}`);
            res.status(500).json({
                error: "Errore nella ricerca degli agenti",
                details: error.message
            });
        }
    }

    /**
     * Recupera dettaglio agente per ID
     */
    async getAgentById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            this.logger.info(`[AgentConfigController] getAgentById - ID: ${id}`);

            const agent = await agentConfigService.findById(id);

            if (!agent) {
                res.status(404).json({
                    error: "Agente non trovato",
                    id
                });
                return;
            }

            res.status(200).json(agent);
        } catch (error: any) {
            this.logger.error(`[AgentConfigController] getAgentById ERROR: ${error.message}`);
            res.status(500).json({
                error: "Errore nel recupero dell'agente",
                details: error.message
            });
        }
    }

    /**
     * Crea nuovo agente
     */
    async createAgent(req: Request, res: Response): Promise<void> {
        try {
            this.logger.info("[AgentConfigController] createAgent - Creazione nuovo agente");

            const data: CreateAgentConfigDTO = req.body;

            // Validazione campi required
            if (!data.contesto || !data.profilo || !data.promptFrameworkRef) {
                res.status(400).json({
                    error: "Campi 'contesto', 'profilo' e 'promptFrameworkRef' sono obbligatori"
                });
                return;
            }

            const newAgent = await agentConfigService.create(data);

            this.logger.info(`[AgentConfigController] createAgent - Agente creato con ID: ${newAgent._id}`);
            res.status(201).json(newAgent);
        } catch (error: any) {
            this.logger.error(`[AgentConfigController] createAgent ERROR: ${error.message}`);
            res.status(500).json({
                error: "Errore nella creazione dell'agente",
                details: error.message
            });
        }
    }

    /**
     * Aggiorna agente esistente
     */
    async updateAgent(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            this.logger.info(`[AgentConfigController] updateAgent - ID: ${id}`);

            const updateData = { ...req.body };

            // Rimuovi campi che non dovrebbero essere aggiornati direttamente
            delete updateData._id;
            delete updateData.createdAt;
            delete updateData.updatedAt;

            const updatedAgent = await agentConfigService.updateById(id, updateData);

            if (!updatedAgent) {
                res.status(404).json({
                    error: "Agente non trovato",
                    id
                });
                return;
            }

            this.logger.info(`[AgentConfigController] updateAgent - Agente aggiornato: ${id}`);
            res.status(200).json(updatedAgent);
        } catch (error: any) {
            this.logger.error(`[AgentConfigController] updateAgent ERROR: ${error.message}`);
            res.status(500).json({
                error: "Errore nell'aggiornamento dell'agente",
                details: error.message
            });
        }
    }

    /**
     * Elimina agente
     */
    async deleteAgent(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            this.logger.info(`[AgentConfigController] deleteAgent - ID: ${id}`);

            const deleted = await agentConfigService.deleteById(id);

            if (!deleted) {
                res.status(404).json({
                    error: "Agente non trovato",
                    id
                });
                return;
            }

            this.logger.info(`[AgentConfigController] deleteAgent - Agente eliminato: ${id}`);
            res.status(200).json({ success: true, id });
        } catch (error: any) {
            this.logger.error(`[AgentConfigController] deleteAgent ERROR: ${error.message}`);
            res.status(500).json({
                error: "Errore nell'eliminazione dell'agente",
                details: error.message
            });
        }
    }
}
