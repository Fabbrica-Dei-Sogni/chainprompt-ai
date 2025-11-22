/**
 * Controller per la gestione delle Configuration (key-value store)
 * Contiene la logica business per le operazioni CRUD sulle configurazioni
 */
import { Request, Response } from "express";
import { configService } from "../../services/databases/mongodb/services/config.service.js";
import { inject, injectable } from "tsyringe";
import { LOGGER_TOKEN } from "../../../core/di/tokens.js";
import { Logger } from "winston";
import { asyncHandler } from "../../middleware/async-handler.middleware.js";
import { NotFoundError, ValidationError } from "../../errors/custom-errors.js";

@injectable()
export class ConfigurationController {

    constructor(
        @inject(LOGGER_TOKEN) private readonly logger: Logger
    ) { }

    /**
     * Lista tutte le configurazioni (con ricerca opzionale per chiave)
     */
    getAllConfigurations = asyncHandler(async (req: Request, res: Response) => {
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
    });

    /**
     * Recupera configurazione per chiave specifica
     */
    getConfigByKey = asyncHandler(async (req: Request, res: Response) => {
        const { key } = req.params;
        this.logger.info(`[ConfigurationController] getConfigByKey - Chiave: ${key}`);

        const value = await configService.getConfigValue(key);

        if (value === null) {
            throw new NotFoundError(`Configurazione con chiave '${key}' non trovata`);
        }

        // Ritorna oggetto completo per consistenza
        res.status(200).json({ key, value });
    });

    /**
     * Crea o aggiorna configurazione (upsert)
     */
    saveConfiguration = asyncHandler(async (req: Request, res: Response) => {
        const { key, value } = req.body;

        // Validazione input
        if (!key || typeof key !== 'string') {
            throw new ValidationError("Campo 'key' richiesto e deve essere una stringa", {
                key: typeof key === 'undefined' ? "Required" : "Must be a string"
            });
        }

        if (value === undefined || value === null) {
            throw new ValidationError("Campo 'value' richiesto", { value: "Required" });
        }

        // Converti value a stringa se necessario
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

        this.logger.info(`[ConfigurationController] saveConfiguration - Key: ${key}`);

        const savedConfig = await configService.saveConfig(key, stringValue);

        res.status(200).json(savedConfig);
    });

    /**
     * Elimina configurazione per chiave
     */
    deleteConfiguration = asyncHandler(async (req: Request, res: Response) => {
        const { key } = req.params;
        this.logger.info(`[ConfigurationController] deleteConfiguration - Key: ${key}`);

        // Usa il metodo deleteByKey del service
        const deleted = await configService.deleteByKey(key);

        if (!deleted) {
            throw new NotFoundError(`Configurazione con chiave '${key}' non trovata`);
        }

        this.logger.info(`[ConfigurationController] deleteConfiguration - Configurazione eliminata: ${key}`);
        res.status(200).json({ success: true, key });
    });
}