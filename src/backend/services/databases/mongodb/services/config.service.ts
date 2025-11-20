import { SchemaService } from './schema.service.js';
import { IConfiguration } from '../models/config.schema.js';
import { Configuration } from '../models/config.schema.js';
import logger from '../../../../logger.backend.js';

export class ConfigService extends SchemaService<IConfiguration> {
  constructor() {
    super(Configuration);
  }

  /**
    * Salva o aggiorna una configurazione key-value
    */
  async saveConfig(key: string, value: string): Promise<IConfiguration> {
    try {
      const result = await this.model.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      logger.info(`[ConfigService] saveConfig success for key=${key}`);
      return result;
    } catch (error: any) {
      logger.error(`[ConfigService] saveConfig ERROR for key=${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ottieni solo il valore dato una key
   */
  async getConfigValue(key: string): Promise<string | null> {
    try {
      const config = await this.model.findOne({ key });
      if (!config) {
        logger.warn(`[ConfigService] getConfigValue: Configuration not found for key=${key}`);
        return null;
      }
      logger.info(`[ConfigService] getConfigValue success for key=${key}`);
      return config.value;
    } catch (error: any) {
      logger.error(`[ConfigService] getConfigValue ERROR for key=${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tutte le configurazioni presenti
   */
  async getAllConfigs(): Promise<IConfiguration[]> {
    try {
      const configs = await this.model.find({});
      logger.info(`[ConfigService] getAllConfigs success: ${configs.length} configs retrieved`);
      return configs;
    } catch (error: any) {
      logger.error(`[ConfigService] getAllConfigs ERROR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina configurazione per chiave
   */
  async deleteByKey(key: string): Promise<boolean> {
    try {
      const result = await this.model.findOneAndDelete({ key });
      if (!result) {
        logger.warn(`[ConfigService] deleteByKey: Configuration not found for key=${key}`);
        return false;
      }
      logger.info(`[ConfigService] deleteByKey success for key=${key}`);
      return true;
    } catch (error: any) {
      logger.error(`[ConfigService] deleteByKey ERROR for key=${key}: ${error.message}`);
      throw error;
    }
  }
}

export const configService = new ConfigService();
