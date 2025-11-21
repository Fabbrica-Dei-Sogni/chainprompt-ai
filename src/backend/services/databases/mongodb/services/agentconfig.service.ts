import { FilterQuery } from 'mongoose';
import { SchemaService } from '../services/schema.service.js';
import { AgentConfig, IAgentConfig } from '../models/agentconfig.schema.js';
import { CreateAgentConfigDTO } from '../../../../dto/createagentconfig.dto.js';
import { promptFrameworkService } from './promptframework.service.js';
import { IPromptFrameworkData } from '../models/promptframework.schema.js';

export class AgentConfigService extends SchemaService<IAgentConfig> {
    constructor() {
        super(AgentConfig);
    }

    // Metodo per recuperare AgentConfig per contesto specifico
    public async findByContesto(contesto: string): Promise<IAgentConfig | null> {
        const filter: FilterQuery<IAgentConfig> = { contesto };
        return this.model.findOne(filter).exec();
    }

    // Crea un nuovo AgentConfig con tutti i dati previsti
    async createAgentConfig(data: CreateAgentConfigDTO): Promise<IAgentConfig> {
        const agent = await AgentConfig.create({
            nome: data.nome,
            descrizione: data.descrizione,
            contesto: data.contesto,
            systemprompt: data.systemprompt,
            promptFrameworkRef: data.promptFrameworkRef,
            promptFramework: data.promptFramework,
            profilo: data.profilo,
            tools: data.tools ?? []
        });
        return agent;
    }

    // ============================================
    // HYBRID RESOLUTION LOGIC
    // ============================================

    /**
     * Recupera il systemprompt finale con logica hybrid:
     * PRIORITÀ 1: agent.promptFramework (embedded custom)
     * PRIORITÀ 2: agent.promptFrameworkRef (template condiviso)
     * PRIORITÀ 3: agent.systemprompt (legacy fallback)
     */
    public async getFinalPrompt(agent: IAgentConfig): Promise<string> {
        // PRIORITÀ 1: Custom embedded framework
        if (agent.promptFramework?.sections?.length) {
            return this.generatePromptFromFramework(agent.promptFramework);
        }

        // PRIORITÀ 2: Template condiviso via riferimento
        if (agent.promptFrameworkRef) {
            const template = await promptFrameworkService.findById(
                agent.promptFrameworkRef.toString()
            );
            if (template?.sections?.length) {
                return this.generatePromptFromFramework(template);
            }
        }

        // PRIORITÀ 3: Fallback legacy systemprompt
        return agent.systemprompt ?? '';
    }

    /**
     * Recupera prompt parziale da sezioni specifiche con logica hybrid
     */
    public async getPromptBySections(
        agent: IAgentConfig,
        sectionKeys: string[]
    ): Promise<string> {
        // PRIORITÀ 1: Custom embedded
        if (agent.promptFramework?.sections?.length) {
            return this.generatePromptFromSections(agent.promptFramework, sectionKeys);
        }

        // PRIORITÀ 2: Template
        if (agent.promptFrameworkRef) {
            const template = await promptFrameworkService.findById(
                agent.promptFrameworkRef.toString()
            );
            if (template?.sections?.length) {
                return this.generatePromptFromSections(template, sectionKeys);
            }
        }

        // PRIORITÀ 3: Fallback
        return agent.systemprompt ?? '';
    }

    /**
     * Helper: Recupera prompt da una singola sezione
     */
    public async getPromptBySection(
        agent: IAgentConfig,
        section: string
    ): Promise<string> {
        return this.getPromptBySections(agent, [section]);
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Genera prompt completo da framework
     */
    private generatePromptFromFramework(framework: IPromptFrameworkData): string {
        return framework.sections
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(s => `${s.description || s.key}: ${s.content}`)
            .join('\n');
    }

    /**
     * Genera prompt parziale da sezioni specifiche
     */
    private generatePromptFromSections(
        framework: IPromptFrameworkData,
        keys: string[]
    ): string {
        return framework.sections
            .filter(s => keys.includes(s.key))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(s => `${s.description || s.key}: ${s.content}`)
            .join('\n');
    }

    /**
     * Recupera agent con template popolato (se presente)
     */
    public async getAgentWithTemplate(agentId: string): Promise<{
        agent: IAgentConfig;
        template?: IPromptFrameworkData;
    }> {
        const agent = await this.findById(agentId);
        if (!agent) throw new Error('Agent not found');

        let template;
        if (agent.promptFrameworkRef) {
            template = await promptFrameworkService.findById(
                agent.promptFrameworkRef.toString()
            );
        }

        return { agent, template: template || undefined };
    }
}

export const agentConfigService = new AgentConfigService();

