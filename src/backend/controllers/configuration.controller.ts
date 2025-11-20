/**
 * Controller per la gestione delle Configuration (key-value store)
 * Contiene la logica business per le operazioni CRUD sulle configurazioni
 */
import { Request, Response } from "express";
import { configService } from "../services/databases/mongodb/services/config.service.js";
import logger from "../logger.backend.js";

export class ConfigurationController {

    /**
     * Lista tutte le configurazioni (con ricerca opzionale per chiave)
     */
    async getAllConfigurations(req: Request, res: Response): Promise<void> {
        try {
            const { search } = req.query;
            logger.info("[ConfigurationController] getAllConfigurations - Recupero configurazioni");

            let configs;

            if (search && typeof search === 'string') {
                // Ricerca per chiave con regex case-insensitive
                logger.info(`[ConfigurationController] Ricerca configurazioni con chiave: ${search}`);
                configs = await configService.findAll({
                    key: { $regex: search, $options: 'i' }
                });
            } else {
                configs = await configService.getAllConfigs();
            }

            res.status(200).json(configs);
        } catch (error: any) {
            logger.error(`[ConfigurationController] getAllConfigurations ERROR: ${error.message}`);
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
            logger.info(`[ConfigurationController] getConfigByKey - Chiave: ${key}`);

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
            logger.error(`[ConfigurationController] getConfigByKey ERROR: ${error.message}`);
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

            logger.info(`[ConfigurationController] saveConfiguration - Key: ${key}`);

            const savedConfig = await configService.saveConfig(key, stringValue);

            res.status(200).json(savedConfig);
        } catch (error: any) {
            logger.error(`[ConfigurationController] saveConfiguration ERROR: ${error.message}`);
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
            logger.info(`[ConfigurationController] deleteConfiguration - Key: ${key}`);

            // Usa il metodo deleteByKey del service
            const deleted = await configService.deleteByKey(key);

            if (!deleted) {
                res.status(404).json({
                    error: "Configurazione non trovata",
                    key
                });
                return;
            }

            logger.info(`[ConfigurationController] deleteConfiguration - Configurazione eliminata: ${key}`);
            res.status(200).json({ success: true, key });
        } catch (error: any) {
            logger.error(`[ConfigurationController] deleteConfiguration ERROR: ${error.message}`);
            res.status(500).json({
                error: "Errore nell'eliminazione della configurazione",
                details: error.message
            });
        }
    }
}

// Esporta istanza singleton del controller
export const configurationController = new ConfigurationController();
