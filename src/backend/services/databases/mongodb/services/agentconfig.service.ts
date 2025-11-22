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
            promptFrameworkRef: data.promptFrameworkRef,  // ← Riferimento obbligatorio
            profilo: data.profilo,
            tools: data.tools ?? []
        });
        return agent;
    }

    // ============================================
    // PROMPT RESOLUTION
    // ============================================

    /**
     * Recupera il prompt finale caricando template da promptFrameworkRef
     * @param agent - AgentConfig con riferimento a PromptFramework
     * @returns Prompt generato dalle sezioni del template, o fallback se non trovato
     */
    public async getFinalPrompt(agent: IAgentConfig): Promise<string> {
        let result = null;
        if (agent.promptFrameworkRef) {
            const template = await promptFrameworkService.findById(
                agent.promptFrameworkRef.toString()
            );
            if (template?.sections?.length) {
                result = this.generatePromptFromFramework(template);
            }
        }

        return result ?? 'nessun prompt trovato';
    }

    /**
     * Recupera prompt parziale contenente solo le sezioni specificate
     * @param agent - AgentConfig con riferimento a PromptFramework
     * @param sectionKeys - Chiavi delle sezioni da includere
     * @returns Prompt parziale generato dalle sezioni filtrate
     */
    public async getPromptBySections(
        agent: IAgentConfig,
        sectionKeys: string[]
    ): Promise<string> {

        let result = null;
        if (agent.promptFrameworkRef) {
            const template = await promptFrameworkService.findById(
                agent.promptFrameworkRef.toString()
            );
            if (template?.sections?.length) {
                result = this.generatePromptFromSections(template, sectionKeys);
            }
        }

        return result ?? 'nessun prompt trovato';
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

