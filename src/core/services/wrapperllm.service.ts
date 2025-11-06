
/**
 * La classe rappresenta i wrapper llm disponibili per una conversazione classica o di tipo rag
 */
import { SYSTEMPROMPT_DFL, ENDPOINT_CHATGENERICA } from './common.services.js';
import { DataRequest } from "../interfaces/datarequest.js";
import { readFileAndConcat } from './readerprompt.service.js';
import { contextFolder } from './common.services.js';
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

export const wrapperServerLLM = async (inputData: DataRequest, context: string, wrapperSendAndPromptLLM: any) => {

    try {
        // const originalUriTokens = req.originalUrl.split('/');
        // const context = originalUriTokens[originalUriTokens.length - 1];

        //se e' il contesto generico si imposta il prompt di default
        const systemPrompt = (context != ENDPOINT_CHATGENERICA) ? await getFrameworkPrompts(context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto

        let answer = await wrapperSendAndPromptLLM(inputData, systemPrompt, context); // Invia il prompt al client
        return answer;
        //res.json({ answer }); // Invia la risposta al client
    } catch (err) {
        console.error('Errore durante la conversazione:', err);
        throw err;
        //res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
}