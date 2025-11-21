import { FilterQuery } from 'mongoose';
import { SchemaService } from './schema.service.js';
import { IPromptFramework, IPromptFrameworkData, IPromptSection, PromptFramework } from '../models/promptframework.schema.js';

/**
 * Service per gestire PromptFramework come collection standalone (templates condivisi)
 * Estende SchemaService per operazioni CRUD base + metodi custom
 */
export class PromptFrameworkService extends SchemaService<IPromptFramework> {
    constructor() {
        super(PromptFramework);
    }

    // ============================================
    // RICERCA E FILTRAGGIO
    // ============================================

    /**
     * Recupera tutti i frameworks attivi
     */
    public async findActive(): Promise<IPromptFramework[]> {
        const filter: FilterQuery<IPromptFramework> = { isActive: true };
        return this.findAll(filter);
    }

    /**
     * Recupera il framework marcato come default
     */
    public async findDefault(): Promise<IPromptFramework | null> {
        const filter: FilterQuery<IPromptFramework> = {
            isDefault: true
        };
        return this.model.findOne(filter).exec();
    }

    /**
     * Recupera framework per nome univoco
     */
    public async findByName(name: string): Promise<IPromptFramework | null> {
        const filter: FilterQuery<IPromptFramework> = { name };
        return this.model.findOne(filter).exec();
    }

    // ============================================
    // GESTIONE DEFAULT
    // ============================================

    /**
     * Imposta un framework come default (rimuove il flag dagli altri)
     */
    public async setAsDefault(id: string): Promise<IPromptFramework | null> {
        // Rimuovi isDefault da tutti gli altri frameworks
        await this.model.updateMany(
            { isDefault: true },
            { $set: { isDefault: false } }
        ).exec();

        // Imposta il framework corrente come default
        return this.updateById(id, { isDefault: true });
    }

    // ============================================
    // GESTIONE SEZIONI
    // ============================================

    /**
     * Aggiunge una sezione ad un framework esistente
     */
    public async addSection(
        id: string,
        section: IPromptSection
    ): Promise<IPromptFramework | null> {
        const framework = await this.findById(id);
        if (!framework) return null;

        framework.sections.push(section);
        return framework.save();
    }

    /**
     * Aggiorna una sezione specifica identificata per key
     */
    public async updateSection(
        id: string,
        sectionKey: string,
        updatedSection: Partial<IPromptSection>
    ): Promise<IPromptFramework | null> {
        const framework = await this.findById(id);
        if (!framework) return null;

        const sectionIndex = framework.sections.findIndex(s => s.key === sectionKey);
        if (sectionIndex === -1) return null;

        framework.sections[sectionIndex] = {
            ...framework.sections[sectionIndex],
            ...updatedSection
        };

        return framework.save();
    }

    /**
     * Rimuove una sezione identificata per key
     */
    public async removeSection(
        id: string,
        sectionKey: string
    ): Promise<IPromptFramework | null> {
        const framework = await this.findById(id);
        if (!framework) return null;

        framework.sections = framework.sections.filter(s => s.key !== sectionKey);
        return framework.save();
    }

    /**
     * Riordina le sezioni secondo l'array di keys fornito
     */
    public async reorderSections(
        id: string,
        orderedKeys: string[]
    ): Promise<IPromptFramework | null> {
        const framework = await this.findById(id);
        if (!framework) return null;

        const reorderedSections: IPromptSection[] = [];
        orderedKeys.forEach((key, index) => {
            const section = framework.sections.find(s => s.key === key);
            if (section) {
                reorderedSections.push({
                    ...section,
                    order: index
                });
            }
        });

        framework.sections = reorderedSections;
        return framework.save();
    }

    // ============================================
    // GENERAZIONE PROMPT
    // ============================================

    /**
     * Genera il prompt finale concatenando tutte le sezioni in ordine
     */
    public generatePrompt(framework: IPromptFrameworkData): string {
        if (!framework.sections?.length) return '';

        return framework.sections
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(s => `${s.description || s.key}: ${s.content}`)
            .join('\n');
    }

    /**
     * Genera prompt parziale da sezioni specifiche
     */
    public generatePromptBySections(
        framework: IPromptFrameworkData,
        sectionKeys: string[]
    ): string {
        if (!framework.sections?.length) return '';

        return framework.sections
            .filter(s => sectionKeys.includes(s.key))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(s => `${s.description || s.key}: ${s.content}`)
            .join('\n');
    }

    // ============================================
    // CLONAZIONE
    // ============================================

    /**
     * Clona un framework esistente con un nuovo nome
     */
    public async cloneFramework(
        id: string,
        newName: string,
        newDescription?: string
    ): Promise<IPromptFramework> {
        const original = await this.findById(id);
        if (!original) {
            throw new Error(`Framework with id ${id} not found`);
        }

        const clonedData: Partial<IPromptFramework> = {
            name: newName,
            description: newDescription || `Clone of ${original.name}`,
            sections: original.sections.map(s => ({ ...s })),
            isDefault: false
        };

        return this.create(clonedData);
    }
}

export const promptFrameworkService = new PromptFrameworkService();
