import { AgentMiddleware } from "langchain";
import { ConfigChainPrompt } from "../../../core/interfaces/protocol/configchainprompt.interface.js";
import { DataRequest } from "../../../core/interfaces/protocol/datarequest.interface.js";
import { RequestBody } from "../../../core/interfaces/protocol/requestbody.interface.js";
import { getDataRequestDFL, getDataRequest, getConfigChainpromptDFL } from "../../../core/converter.models.js";
import { LLMProvider } from "../../../core/enums/llmprovider.enum.js";
import { senderToLLM, senderToAgent } from "../../../core/services/llm-sender.service.js";
import { getFrameworkPrompts } from "./reader-prompt.service.js";
import { ENDPOINT_CHATGENERICA, SYSTEMPROMPT_DFL } from "../common.service.js";
import { getChainWithHistory } from "../databases/redis/redis.service.js";
import { getInstanceLLM } from "../../../core/services/llm-chain.service.js";
import { getPromptTemplate } from "../../templates/chainpromptbase.template.js";

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

        const { temperature, modelname, maxTokens, numCtx, format, keyconversation, noappendchat }: DataRequest = inputData;//extractDataFromRequest(req, contextchat);
        let config: ConfigChainPrompt = {
            temperature, modelname, maxTokens, numCtx, format
        };
        const chain = await getChainWithHistory(systemPrompt, getInstanceLLM(provider, config), noappendchat, keyconversation)
        return await senderToLLM(inputData, systemPrompt, provider, getPromptTemplate(systemPrompt), chain); // Invia il prompt al client
    } catch (err) {
        console.error('Errore durante la comunicazione con un llm:', JSON.stringify(err));
        throw err;
        //res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
};

/**
 * 
 * @param systemPrompt 
 * @param inputData 
 * @param provider 
 * @param tools 
 * @param middleware 
 * @param nomeagente 
 * @returns 
 */
export const handleAgent = async (systemPrompt: string, inputData: DataRequest, provider: LLMProvider, tools: any[], middleware: AgentMiddleware[], nomeagente: string): Promise<any> => {
    try {

        const { question, keyconversation, temperature, modelname, maxTokens, numCtx, format }: DataRequest = inputData;
        let config: ConfigChainPrompt = {
            ...getConfigChainpromptDFL(), temperature, modelname, maxTokens, numCtx, format
        };
        return senderToAgent(question!, keyconversation, config, systemPrompt, provider, tools, middleware, nomeagente);

    } catch (err) {
        console.error('Errore durante la comunicazione con un agente:', JSON.stringify(err));
        throw err;
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