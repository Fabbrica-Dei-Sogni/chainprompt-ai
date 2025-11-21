import '../../logger.backend.js';
import { contextFolder } from '../common.service.js';
import { agentConfigService } from '../databases/mongodb/services/agentconfig.service.js';
import { readFileAndConcat } from '../filesystem.service.js';

export class ReaderPromptService {
    private static instance: ReaderPromptService;

    private constructor() { }

    public static getInstance(): ReaderPromptService {
        if (!ReaderPromptService.instance) {
            ReaderPromptService.instance = new ReaderPromptService();
        }
        return ReaderPromptService.instance;
    }

    /**
     * Retrieves the framework prompts for the specified context.
     *
     * Il system prompt è generato a partire dalla composizione dei file presenti nelle sotto cartelle di dataset/fileset
     * @param {string} contesto The context for which to retrieve the prompts.
     * @returns {Promise<string>} A Promise that resolves with the framework prompts as a string.
     */
    public async getFrameworkPrompts(contesto: string): Promise<string> {
        let sorgente = "file system";
        const msg = `System prompt per il contesto ${contesto} caricato da ${sorgente}`;
        let result = "nessun system prompt trovato";

        const loadedSystemPrompt = await this.loadFrameworkPrompts(contesto);
        if (loadedSystemPrompt) {
            sorgente = "mongodb";
            result = loadedSystemPrompt;
        }
        else {
            result = await readFileAndConcat(['prompt.ruolo', 'prompt.obiettivo', 'prompt.azione', 'prompt.contesto'], contextFolder + '/' + contesto);
        }

        console.info(msg)
        return result;
    }

    /**
     * 
     * @param contesto Recupera da un systemprompt di contesto una sua sezione.
     * Per ora le sezioni riconosciute sono: ruolo, azione, obiettivo, contesto
     * @param section 
     * @returns 
     */
    public async getSectionsPrompts(contesto: string, section: string): Promise<string> {
        const systemPrompt = [section];
        return await readFileAndConcat(systemPrompt, contextFolder + '/' + contesto);
    }

    /**
     * Carica il system prompt per la chiave di contesto scelta
     * @param key 
     * @returns 
     */
    public async loadFrameworkPrompts(keycontext: string): Promise<string | null> {
        const agentconfig = await agentConfigService.findByContesto(keycontext);
        const systemPrompt = agentconfig ? agentConfigService.getFinalPrompt(agentconfig) : null;
        return systemPrompt;
        //return await readFileAndConcat(systemPrompt, contextFolder + '/' + contesto);
    }

    public async loadSectionPrompt(keycontext: string, section: string): Promise<string | null> {
        const agentconfig = await agentConfigService.findByContesto(keycontext);
        return agentconfig ? agentConfigService.getPromptBySection(agentconfig, section) : null;
    }
}

export const readerPromptService = ReaderPromptService.getInstance();
