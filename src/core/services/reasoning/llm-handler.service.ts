
import { SYSTEMPROMPT_DFL, ENDPOINT_CHATGENERICA } from '../common.services.js';
import { DataRequest } from "../../interfaces/datarequest.js";
import { readFileAndConcat } from '../business/reader-prompt.service.js';
import { contextFolder } from '../common.services.js';
import { RequestBody } from '../../interfaces/requestbody.js';
import '../../../logger.js';
import { LLMProvider } from '../../models/llmprovider.enum.js';
import { senderToAgent, senderToLLM } from './llm-sender.service.js';
import { Tool } from '@langchain/core/tools';
import { AgentMiddleware } from 'langchain';

/**
    Handler che estrae i dati dalla request e li prepara per l'invio al wrapper llm

export interface RequestBody {
    text: string;                 //Campo standard usato come input come ad esempio da cheshirecat
    question: string;             // deprecated Domanda inviata dall'utente
    modelname?: string;           // Nome del modello (predefinito a "llama" se non specificato)
    temperature?: number;         // Valore della temperatura per il modello (default: 0.1)
    sessionchat?: string;         // Identificativo della sessione (default: "defaultsession" se non presente)
    maxTokens?: number;           // Numero massimo di token (default: 8032)
    numCtx?: number;              // Numero massimo di contesto (default: 8032)
    //parametro introdotto per disabilitare l'append della conversazione.
    //cheshire ad esempio gestisce nativamente le conversazioni e non e' necessario, anzi sconsigliato, gestire l'append da chainprompt
    noappendchat?: boolean;

}

La callback getSendPromptCallback istruisce il provider llm da utilizzare per inviare il prompt.


    il wrapperllm istanzia il chain ed esegue la chiamata ritornando la risposta
 */
export const handleLLM = async (identifier: string, inputData: DataRequest, context: string, provider: LLMProvider): Promise<any> => {
    try {
        
        console.log("Identificativo chiamante: ", identifier);

        const systemPrompt = (context != ENDPOINT_CHATGENERICA) ? await getFrameworkPrompts(context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto
        let answer = await senderToLLM(inputData, systemPrompt, provider); // Invia il prompt al client
        
        return answer;
    } catch (err) {
        console.error('Errore durante la conversazione:', err);
        throw err;
        //res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
};

/**
 * 
 
 * @param identifier 
 * @param data 
 * @param context 
 * @param provider 
 * @param tools 
 * @returns 
 */
export const handleAgent = async (identifier: string, inputData: DataRequest, context: string, provider: LLMProvider, tools: Tool[], middleware : AgentMiddleware[]): Promise<any> => {
    try {
        
        console.log("Identificativo chiamante: ", identifier);

        //Recupero del systemprompt dalla logica esistente
        const systemPrompt = (context != ENDPOINT_CHATGENERICA) ? await getFrameworkPrompts(context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto
        console.log("System prompt dell'agente: " + systemPrompt);
        
        const answer = senderToAgent(context, inputData, systemPrompt, provider, tools, middleware);
        
        return answer;
    } catch (err) {
        console.error('Errore durante la comunicazione con un agente:', err);
        throw err;
        //res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
};



/**
 * Il metodo ha lo scopo di estrapolare dalla request entrante applicativa i valori di input tra cui il prompt utente, il nome del modello, la temperatura e altre informazioni peculiari,
 * successivamente gestisce uno storico conversazione che nel tempo evolverà seguendo le best practise utilizzando langchain e gli strumenti che offre,
 * ritorna i risultati di systempromp e question parsando in modo opportuno l'inizio della conversazione con il prompt entrante.
 * In futuro prompt con all'interno variabili placeholder avranno una gestione tale da essere compilati tra piu catene di domanda e risposta
 * 
 * 
 * @param req 
 * @param systemPrompt 
 * @param context 
 * @returns 
 */
export function extractDataFromRequest(body: RequestBody, context: string, identifier: string, isAgent: boolean = false): DataRequest {
    console.log("Estrazione informazioni data input per la preparazione al prompt di sistema....");

    //Recupero della domanda dal campo question o dal campo text (standard cheshire)
    var inputvalue = body.question ?? body.text;
    const question = '\n' + inputvalue;

    const modelname = body.modelname ? body.modelname : "llama";
    const temperature = body.temperature || 0.1;

    const sessionchat = body.sessionchat;
    const session = sessionchat ? sessionchat : "defaultsession";
    let keyconversation = identifier + "_" + context + "_" + session;

    if (isAgent)
        keyconversation = "agent" + "_" + keyconversation;

    console.log("Avviata conversione con chiave : " + keyconversation);

    //    const keyconversation = ipAddress + "_" + context;
    //console.log("Indirizzo ip: ", ipAddress);
    const maxTokens = body.maxTokens || 8032;
    const numCtx = body.numCtx || 8032;
    const noappendchat = body.noappendchat || false;



    return { question, temperature, modelname, maxTokens, numCtx, keyconversation, noappendchat };
}

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