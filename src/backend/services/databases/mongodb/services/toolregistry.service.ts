import { Model } from 'mongoose';
import { SchemaService } from './schema.service.js'; // importa la tua base class
import { IToolRegistry, ToolRegistry } from '../models/toolregistry.schema.js';
import { AgentConfig } from '../models/agentconfig.schema.js'; // importa i tuoi modelli

export class ToolConfigService extends SchemaService<IToolRegistry> {
  constructor(model: Model<IToolRegistry>) {
    super(model);
  }

  // Metodo custom: caricamento dinamico dei tool per agente
  async getAgentTools(agentId: string) {
    const agentConfig = await AgentConfig.findById(agentId).exec();
    if (!agentConfig || !agentConfig.tools) return [];

    const toolDocs = await ToolRegistry.find({
      name: { $in: agentConfig.tools },
      enabled: true
    }).exec();

    // Caricamento dinamico dei moduli tool JS/TS
    const loadedTools = await Promise.all(
      toolDocs.map(async (tool) => {
        const module = await import(tool.modulePath);
        return module.default || module;
      })
    );
    return loadedTools;
  }
}
