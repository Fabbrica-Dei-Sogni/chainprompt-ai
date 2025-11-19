import '../../logger.backend.js';
import { contextFolder } from '../common.service.js';
import { agentConfigService } from '../databases/mongodb/services/agentconfig.service.js';
import { readFileAndConcat } from '../filesystem.service.js';


/**
 * Retrieves the framework prompts for the specified context.
 *
 Il system prompt è generato a partire dalla composizione dei file presenti nelle sotto cartelle di dataset/fileset
 * @param {string} contesto The context for which to retrieve the prompts.
 * @returns {Promise<string>} A Promise that resolves with the framework prompts as a string.
 */
export const getFrameworkPrompts = async (contesto: string): Promise<string> => {

    const loadedSystemPrompt = await loadFrameworkPrompts(contesto);
    if (loadedSystemPrompt)
    {
        console.info("Contesto "+contesto+" caricato da mongodb")
        return loadedSystemPrompt;
    }
    else {
        console.info("Contesto "+contesto+" caricato da file system")
        const systemPrompt = ['prompt.ruolo', 'prompt.obiettivo', 'prompt.azione', 'prompt.contesto'];
        return await readFileAndConcat(systemPrompt, contextFolder + '/' + contesto);
    }
};

/**
 * 
 * @param contesto Recupera da un systemprompt di contesto una sua sezione.
 Per ora le sezioni riconosciute sono: ruolo, azione, obiettivo, contesto
 * @param section 
 * @returns 
 */
export const getSectionsPrompts = async (contesto: string, section: string): Promise<string> => {
    const systemPrompt = [section];
    return await readFileAndConcat(systemPrompt, contextFolder + '/' + contesto);
};

/**
 * Carica il system prompt per la chiave di contesto scelta
 * @param key 
 * @returns 
 */
export const loadFrameworkPrompts = async (keycontext: string): Promise<string | null> => {
    const agentconfig = await agentConfigService.findByContesto(keycontext);
    const systemPrompt = agentconfig ? agentConfigService.getFinalPrompt(agentconfig) : null;
    return systemPrompt;
    //return await readFileAndConcat(systemPrompt, contextFolder + '/' + contesto);
};

export const loadSectionPrompt = async (keycontext: string, section: string): Promise<string | null> => {
    const agentconfig = await agentConfigService.findByContesto(keycontext);
    return agentconfig ? agentConfigService.getPromptBySection(agentconfig, section) : null;
};
