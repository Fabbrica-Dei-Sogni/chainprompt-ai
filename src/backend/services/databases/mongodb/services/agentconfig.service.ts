import { FilterQuery } from 'mongoose';
import { SchemaService } from '../services/schema.service.js';
import { AgentConfig, IAgentConfig } from '../models/agentconfig.schema.js';
import { CreateAgentConfigDTO } from '../../../../dto/createagentconfig.dto.js';

export class AgentConfigService extends SchemaService<IAgentConfig> {
    constructor() {
        super(AgentConfig);
    }

    // Metodo per recuperare AgentConfig per contesto specifico
    public async findByContesto(contesto: string): Promise<IAgentConfig | null> {
        const filter: FilterQuery<IAgentConfig> = { contesto };
        return this.model.findOne(filter).exec();
    }

    // Crea nuovo agent con framework canonico "default"
    // Crea un nuovo AgentConfig con tutti i dati previsti
    async createAgentConfig(data: CreateAgentConfigDTO): Promise<IAgentConfig> {
        const agent = await AgentConfig.create({
            nome: data.nome,
            descrizione: data.descrizione,
            contesto: data.contesto,
            systemprompt: data.systemprompt,
            promptFrameworks: data.promptFrameworks ?? [],
            profilo: data.profilo,
            tools: data.tools ?? []
        });
        return agent;
    }

    /**
     * Recupera il systemprompt dalle sezioni associate all'agent config sorgente
     * @param agent 
     * @returns 
     */
    public getFinalPrompt(agent: IAgentConfig): string {
        const defaultFramework = agent.promptFrameworks?.find(f => f.isDefault);
        if (defaultFramework) {
            return defaultFramework.sections
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map(s => `${s.description || s.key}: ${s.content}`)
                .join('\n');
        }
        return agent.systemprompt ?? '';
    }

    public getPromptBySection(agent: IAgentConfig, section: string) {
        return this.getPromptBySections(agent, [section]);
    }

    public getPromptBySections(
        agent: IAgentConfig,
        sectionKeys: string[]
    ): string {
        const defaultFramework = agent.promptFrameworks?.find(f => f.isDefault);
        if (defaultFramework) {
            return defaultFramework.sections
                .filter(s => sectionKeys.includes(s.key))
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map(s => `${s.description || s.key}: ${s.content}`)
                .join('\n');
        }
        // fallback su systemprompt se presente
        return agent.systemprompt ?? '';
    }

}

export const agentConfigService = new AgentConfigService();
