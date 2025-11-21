import { AgentMiddleware } from "langchain";
import { DataRequest } from "../../../core/interfaces/protocol/datarequest.interface.js";
import { RequestBody } from "../../../core/interfaces/protocol/requestbody.interface.js";
import { converterModels } from "../../../core/converter.models.js";
import { llmSenderService } from "../../../core/services/llm-sender.service.js";
import { readerPromptService } from "./reader-prompt.service.js";
import { ENDPOINT_CHATGENERICA, SYSTEMPROMPT_DFL } from "../common.service.js";
import { getChainWithHistory } from "../databases/redis/redis.service.js";
import { llmChainService } from "../../../core/services/llm-chain.service.js";
import { getPromptTemplate } from "../../templates/chainpromptbase.template.js";

export type Preprocessor = (req: any) => Promise<void>;

export class HandlerService {
    private static instance: HandlerService;

    private constructor() { }

    public static getInstance(): HandlerService {
        if (!HandlerService.instance) {
            HandlerService.instance = new HandlerService();
        }
        return HandlerService.instance;
    }

    /**
     Preprocessore di default (nessuna modifica, utile per casi generici)
     * @param req 
     */
    public defaultPreprocessor: Preprocessor = async (req) => {
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
    public async handleLLM(systemPrompt: string, inputData: DataRequest): Promise<any> {
        try {

            let { question, keyconversation, noappendchat, config } = inputData; // Changed from `body ? converterModels.getDataRequest(body, context, identifier, isAgent) : converterModels.getDataRequestDFL();` to use `inputData` directly, as `body`, `context`, `identifier`, `isAgent` are not defined in this scope.
            const chain = await getChainWithHistory(systemPrompt, llmChainService.getInstanceLLM(config), noappendchat, keyconversation)
            return await llmSenderService.senderToLLM(inputData, systemPrompt, getPromptTemplate(systemPrompt), chain); // Invia il prompt al client
        } catch (err) {
            console.error('Errore durante la comunicazione con un llm:', JSON.stringify(err));
            throw err;
        }
    }

    /**
     * 
     * @param systemPrompt 
     * @param inputData 
     * @param tools 
     * @param middleware 
     * @param nomeagente 
     * @returns 
     */
    public async handleAgent(systemPrompt: string, inputData: DataRequest, tools: any[], middleware: AgentMiddleware[], nomeagente: string): Promise<any> {
        try {

            const { question, keyconversation, config }: DataRequest = inputData;
            return llmSenderService.senderToAgent(question!, keyconversation, config, systemPrompt, tools, middleware, nomeagente);

        } catch (err) {
            console.error('Errore durante la comunicazione con un agente:', JSON.stringify(err));
            throw err;
        }
    }


    /**
     * Recupera i dati dalla request entrante, l'identificatore della richiesta
     quindi il system prompt in base al contesto richiesto.
     fornisce anche la chiave di conversazione usata per l'interazione con l'llm o l'agente
     * @param req 
     * @param context 
     * @returns 
     */
    public async getDataByResponseHttp(req: any, context: string, identifier: string, preprocessor: Preprocessor, isAgent: boolean = false) {

        await preprocessor(req);

        //step 0. Recupero body in formato RequestBody
        let body = req.body as RequestBody;

        //step 1. Recupero informazioni di default
        let inputData = converterModels.getDataRequestDFL();

        //step 2. Recupero del systemprompt dalla logica esistente
        const systemPrompt = (context != ENDPOINT_CHATGENERICA) ? await readerPromptService.getFrameworkPrompts(context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto
        console.log("System prompt : " + systemPrompt);

        console.log("Identificativo chiamante: ", identifier);

        //recupero del requestbody
        let updateData: DataRequest = converterModels.getDataRequest(body, context, identifier, isAgent);

        // Merge di inputData con updatedData (updatedData sovrascrive in caso di conflitti)
        const resultData: DataRequest = {
            ...inputData,
            ...updateData
        };

        return { systemPrompt, resultData };
    }
}

export const handlerService = HandlerService.getInstance();