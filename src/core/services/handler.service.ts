
import { DataRequest } from "../interfaces/datarequest.js";
import { readFileAndConcat } from './business/reader-prompt.service.js';
import { contextFolder, ENDPOINT_CHATGENERICA, SYSTEMPROMPT_DFL } from './common.services.js';
import { RequestBody } from '../interfaces/requestbody.js';
import '../../logger.js';
import { LLMProvider } from '../models/llmprovider.enum.js';
import { senderToAgent, senderToLLM } from './reasoning/llm-sender.service.js';
import { Tool } from '@langchain/core/tools';
import { AgentMiddleware } from 'langchain';
import * as requestIp from 'request-ip';

export type Preprocessor = (req: any) => Promise<void>;

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
export const handleLLM = async (systemPrompt: string, inputData: DataRequest, context: string, provider: LLMProvider): Promise<any> => {
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
export const handleAgent = async (systemPrompt: string, inputData: DataRequest, context: string, provider: LLMProvider, tools: Tool[], middleware: AgentMiddleware[]): Promise<any> => {
    try {
        return senderToAgent(context, inputData, systemPrompt, provider, tools, middleware);
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
export async function getData(req: any, context: string) {
  let body = req.body as RequestBody;
  //Recupero del systemprompt dalla logica esistente
  const systemPrompt = (context != ENDPOINT_CHATGENERICA) ? await getFrameworkPrompts(context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto
  console.log("System prompt dell'agente: " + systemPrompt);
  //dopo il preprocessing per il tema dedicato vengono recuperati l'identificativo, in questo caso l'ip address del chiamante, e il body ricevuto dagli endpoint applicativi che sono a norma per una interrogazione llm
  //recupero identificativo chiamante, in questo caso l'ip address
  const identifier = requestIp.getClientIp(req)!;
  console.log("Identificativo chiamante: ", identifier);
  //recupero del requestbody
  const inputData: DataRequest = getDataRequest(body, context, identifier, true);
  return { systemPrompt, inputData };
}

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


/**
* Il metodo ha lo scopo di estrapolare dalla request entrante applicativa i valori di input tra cui il prompt utente, il nome del modello, la temperatura e altre informazioni peculiari,
* successivamente gestisce uno storico conversazione che nel tempo evolverà seguendo le best practise utilizzando langchain e gli strumenti che offre,
* ritorna i risultati di systempromp e question parsando in modo opportuno l'inizio della conversazione con il prompt entrante.
* In futuro prompt con all'interno variabili placeholder avranno una gestione tale da essere compilati tra piu catene di domanda e risposta
 * 
 * @param body 
 * @param context 
 * @param identifier 
 * @param isAgent 
 * @returns 
 */
export function getDataRequest(body: RequestBody, context: string, identifier: string, isAgent: boolean = false): DataRequest {
    console.log("Estrazione informazioni data input per la preparazione al prompt di sistema....");

    //Recupero della domanda dal campo question o dal campo text (standard cheshire)
    const question = body.question ?? body.text;
    //recupero del modelname o default
    const modelname = body.modelname ? body.modelname : "llama";
    //recupero della temperature o default
    const temperature = body.temperature || 0.1;
    //recupero della sessione o default
    const sessionchat = body.sessionchat;
    const session = sessionchat ? sessionchat : "defaultsession";
    //recupero maxTokens o default
    const maxTokens = body.maxTokens || 8032;
    //recupero numCtx o default
    const numCtx = body.numCtx || 8032;
    //recupero richiesta storico o default
    const noappendchat = body.noappendchat || false;

    //XXX: costruzione dell'identificativo di sessione
    let keyconversation = identifier + "_" + context + "_" + session;
    //identificativo indirizzato a un agente piuttosto che a una chat conversazionale 
    //(capire se in futuro ha senso questa distinzione)
    if (isAgent)
        keyconversation = "agente" + "_" + keyconversation;
    else
        keyconversation = "chat" + "_" + keyconversation;


    console.log("Avviata conversione con chiave : " + keyconversation);
    console.log("Domanda richiesta: " + question);
    console.log("Modello llm utilizzato : " + modelname);
    console.log("temperature impostata a " + temperature);


    return { question, temperature, modelname, maxTokens, numCtx, keyconversation, noappendchat };
}