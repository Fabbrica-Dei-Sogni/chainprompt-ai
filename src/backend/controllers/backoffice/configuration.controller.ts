/**
 * Controller per la gestione delle Configuration (key-value store)
 * Contiene la logica business per le operazioni CRUD sulle configurazioni
 */
import { Request, Response } from "express";
import { configService } from "../../services/databases/mongodb/services/config.service.js";
import { inject, injectable } from "tsyringe";
import { LOGGER_TOKEN } from "../../../core/di/tokens.js";
import { Logger } from "winston";

@injectable()
export class ConfigurationController {
    
    constructor(
        @inject(LOGGER_TOKEN) private readonly logger: Logger
    ) {}

    /**
     * Lista tutte le configurazioni (con ricerca opzionale per chiave)
     */
    async getAllConfigurations(req: Request, res: Response): Promise<void> {
        try {
            const { search } = req.query;
            this.logger.info("[ConfigurationController] getAllConfigurations - Recupero configurazioni");

            let configs;

            if (search && typeof search === 'string') {
                // Ricerca per chiave con regex case-insensitive
                this.logger.info(`[ConfigurationController] Ricerca configurazioni con chiave: ${search}`);
                configs = await configService.findAll({
                    key: { $regex: search, $options: 'i' }
                });
            } else {
                configs = await configService.getAllConfigs();
            }

            res.status(200).json(configs);
        } catch (error: any) {
            this.logger.error(`[ConfigurationController] getAllConfigurations ERROR: ${error.message}`);
            res.status(500).json({
                error: "Errore nel recupero delle configurazioni",
                details: error.message
            });
        }
    }

    /**
     * Recupera configurazione per chiave specifica
     */
    async getConfigByKey(req: Request, res: Response): Promise<void> {
        try {
            const { key } = req.params;
            this.logger.info(`[ConfigurationController] getConfigByKey - Chiave: ${key}`);

            const value = await configService.getConfigValue(key);

            if (value === null) {
                res.status(404).json({
                    error: "Configurazione non trovata",
                    key
                });
                return;
            }

            // Ritorna oggetto completo per consistenza
            res.status(200).json({ key, value });
        } catch (error: any) {
            this.logger.error(`[ConfigurationController] getConfigByKey ERROR: ${error.message}`);
            res.status(500).json({
                error: "Errore nel recupero della configurazione",
                details: error.message
            });
        }
    }

    /**
     * Crea o aggiorna configurazione (upsert)
     */
    async saveConfiguration(req: Request, res: Response): Promise<void> {
        try {
            const { key, value } = req.body;

            // Validazione input
            if (!key || typeof key !== 'string') {
                res.status(400).json({
                    error: "Campo 'key' richiesto e deve essere una stringa"
                });
                return;
            }

            if (value === undefined || value === null) {
                res.status(400).json({
                    error: "Campo 'value' richiesto"
                });
                return;
            }

            // Converti value a stringa se necessario
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

            this.logger.info(`[ConfigurationController] saveConfiguration - Key: ${key}`);

            const savedConfig = await configService.saveConfig(key, stringValue);

            res.status(200).json(savedConfig);
        } catch (error: any) {
            this.logger.error(`[ConfigurationController] saveConfiguration ERROR: ${error.message}`);
            res.status(500).json({
                error: "Errore nel salvataggio della configurazione",
                details: error.message
            });
        }
    }

    /**
     * Elimina configurazione per chiave
     */
    async deleteConfiguration(req: Request, res: Response): Promise<void> {
        try {
            const { key } = req.params;
            this.logger.info(`[ConfigurationController] deleteConfiguration - Key: ${key}`);

            // Usa il metodo deleteByKey del service
            const deleted = await configService.deleteByKey(key);

            if (!deleted) {
                res.status(404).json({
                    error: "Configurazione non trovata",
                    key
                });
                return;
            }

            this.logger.info(`[ConfigurationController] deleteConfiguration - Configurazione eliminata: ${key}`);
            res.status(200).json({ success: true, key });
        } catch (error: any) {
            this.logger.error(`[ConfigurationController] deleteConfiguration ERROR: ${error.message}`);
            res.status(500).json({
                error: "Errore nell'eliminazione della configurazione",
                details: error.message
            });
        }
    }
}