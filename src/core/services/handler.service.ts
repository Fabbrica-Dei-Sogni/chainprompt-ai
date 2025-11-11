
import { DataRequest } from "../interfaces/datarequest.js";
import { ENDPOINT_CHATGENERICA, SYSTEMPROMPT_DFL } from './common.services.js';
import { RequestBody } from '../interfaces/requestbody.js';
import '../../logger.js';
import { LLMProvider } from '../models/llmprovider.enum.js';
import { senderToAgent, senderToLLM } from './reasoning/llm-sender.service.js';
import { Tool } from '@langchain/core/tools';
import { AgentMiddleware } from 'langchain';
import { getDataRequest, getDataRequestDFL } from "../models/converter.models.js";
import { getFrameworkPrompts } from "./business/reader-prompt.service.js";

export type Preprocessor = (req: any) => Promise<void>;

/**
 Preprocessore di default (nessuna modifica, utile per casi generici)
 * @param req 
 */
export const defaultPreprocessor: Preprocessor = async (req) => {
  try {
    // Nessuna modifica, usato per contesti generici
  } catch (error) {
    console.error("Errore nel preprocessore di default:", error);
    throw error;
  }
};

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
export const handleLLM = async (systemPrompt: string, inputData: DataRequest, provider: LLMProvider): Promise<any> => {
    try {
        return await senderToLLM(inputData, systemPrompt, provider); // Invia il prompt al client
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
export const handleAgent = async (systemPrompt: string, inputData: DataRequest, provider: LLMProvider, context: string, tools: Tool[], middleware: AgentMiddleware[]): Promise<any> => {
    try {
        return senderToAgent(inputData, systemPrompt, provider, context, tools, middleware);
    } catch (err) {
        console.error('Errore durante la comunicazione con un agente:', err);
        throw err;
        //res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
};

/**
 * Recupera i dati dalla request entrante, l'identificatore della richiesta
 quindi il system prompt in base al contesto richiesto.
 fornisce anche la chiave di conversazione usata per l'interazione con l'llm o l'agente
 * @param req 
 * @param context 
 * @returns 
 */
export async function getDataByResponseHttp(req: any, context: string, identifier: string, preprocessor: Preprocessor, isAgent: boolean = false) {
    
    await preprocessor(req);

    //step 0. Recupero body in formato RequestBody
    let body = req.body as RequestBody;

    //step 1. Recupero informazioni di default
    let inputData = getDataRequestDFL();

    //step 2. Recupero del systemprompt dalla logica esistente
    const systemPrompt = (context != ENDPOINT_CHATGENERICA) ? await getFrameworkPrompts(context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto
    console.log("System prompt : " + systemPrompt);

    console.log("Identificativo chiamante: ", identifier);

    //recupero del requestbody
    let updateData: DataRequest = getDataRequest(body, context, identifier, isAgent);

    // Merge di inputData con updatedData (updatedData sovrascrive in caso di conflitti)
    const resultData: DataRequest = {
        ...inputData,
        ...updateData
    };

    return { systemPrompt, resultData };
}

