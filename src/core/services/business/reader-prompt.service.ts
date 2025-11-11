import '../../../logger.js';
import { contextFolder } from '../common.services.js';
import { readFileAndConcat } from '../filesystem.service.js';


/**
 * Retrieves the framework prompts for the specified context.
 *
 Il system prompt è generato a partire dalla composizione dei file presenti nelle sotto cartelle di dataset/fileset
 * @param {string} contesto The context for which to retrieve the prompts.
 * @returns {Promise<string>} A Promise that resolves with the framework prompts as a string.
 */
export const getFrameworkPrompts = async (contesto: string): Promise<string> => {
    const systemPrompt = ['prompt.ruolo', 'prompt.obiettivo', 'prompt.azione', 'prompt.contesto'];
    return await readFileAndConcat(systemPrompt, contextFolder + '/' + contesto);
};
