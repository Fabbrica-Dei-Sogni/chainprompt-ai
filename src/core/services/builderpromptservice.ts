import { readFileAndConcat } from './readerpromptservice.js';
import { uriFisso, contextFolder, ContextChat } from './commonservices.js';

/**
 * Retrieves the recruiter prompt with the system prompt.
 * @deprecated
 * This method should be called at the beginning of a conversation.
 * It can be global for the first request (fair mode)
 * Or personalized for the interlocutor user (recruiter mode)
 *
 * @param {*} question Unused parameter.
 * @returns {Promise<string>} A Promise that resolves with the recruiter prompt as a string.
 */
const getPromptRecruiter = async (question?: any): Promise<string> => {
    const systemPrompt = ['prompt.ruolo', 'prompt.obiettivo', 'prompt.azione', 'prompt.contesto'];
    return await getPromptContext(ContextChat.CHAT_BOT_CV, systemPrompt);
};

/**
 * @deprecated 
 * Retrieves the docente linux prompt with the system prompt.
 *
 * @returns {Promise<string>} A Promise that resolves with the docente linux prompt as a string.
 */
const getPromptDocenteLinux = async (): Promise<string> => {
    const systemPrompt = ['prompt.ruolo', 'prompt.obiettivo', 'prompt.azione', 'prompt.contesto'];
    return await getPromptContext(ContextChat.DOCENTE_LINUX, systemPrompt);
};

/**
 * @deprecated
 * Retrieves the prompt for the specified context with the system prompt.
 *
 * @param {ContextChat} contesto The context for which to retrieve the prompt.
 * @param {string[]} systemPrompt The system prompt to use.
 * @returns {Promise<string>} A Promise that resolves with the context prompt as a string.
 */
const getPromptContext = async (contesto: ContextChat, systemPrompt: string[]): Promise<string> => {
    return await readFileAndConcat(systemPrompt, uriFisso + '/' + contesto);
};

/**
 * Retrieves the framework prompts for the specified context.
 *
 * @param {string} contesto The context for which to retrieve the prompts.
 * @returns {Promise<string>} A Promise that resolves with the framework prompts as a string.
 */
const getFrameworkPrompts = async (contesto: string): Promise<string> => {
    const systemPrompt = ['prompt.ruolo', 'prompt.obiettivo', 'prompt.azione', 'prompt.contesto'];
    return await readFileAndConcat(systemPrompt, contextFolder + '/' + contesto);
};

export { getPromptRecruiter, getPromptDocenteLinux, getFrameworkPrompts };