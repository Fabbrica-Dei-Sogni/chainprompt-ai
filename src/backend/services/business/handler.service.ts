import { AgentMiddleware } from "langchain";
import { DataRequest } from "../../../core/interfaces/protocol/datarequest.interface.js";
import { RequestBody } from "../../../core/interfaces/protocol/requestbody.interface.js";
import { LLMSenderService } from "../../../core/services/llm-sender.service.js";
import { ReaderPromptService } from "./reader-prompt.service.js";
import { ENDPOINT_CHATGENERICA, SYSTEMPROMPT_DFL } from "../common.service.js";
import { getChainWithHistory } from "../databases/redis/redis.service.js";
import { getPromptTemplate } from "../../templates/chainpromptbase.template.js";
import { LLMChainService } from "../../../core/services/llm-chain.service.js";
import { ConverterModels } from "../../../core/converter.models.js";
import { inject, injectable } from "tsyringe";
import { LOGGER_TOKEN } from "../../../core/di/tokens.js";
import { Logger } from "winston";

export type Preprocessor = (req: any) => Promise<void>;


@injectable()
export class HandlerService {

    constructor(
        @inject(LOGGER_TOKEN) private readonly logger: Logger,
        private readonly readerPromptService: ReaderPromptService,
        private readonly converterModels: ConverterModels,
        private readonly llmSenderService: LLMSenderService,
        private readonly llmChainService: LLMChainService,
    ) { }

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

            this.logger.info(`HandlerService - handleLLM - Invio richiesta LLM con modello ${inputData.config?.modelname}`);

            let { question, keyconversation, noappendchat, config } = inputData; // Changed from `body ? converterModels.getDataRequest(body, context, identifier, isAgent) : converterModels.getDataRequestDFL();` to use `inputData` directly, as `body`, `context`, `identifier`, `isAgent` are not defined in this scope.
            const chain = await getChainWithHistory(systemPrompt, this.llmChainService.getInstanceLLM(config), noappendchat, keyconversation)
            return await this.llmSenderService.senderToLLM(inputData, systemPrompt, getPromptTemplate(systemPrompt), chain); // Invia il prompt al client
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

            this.logger.info(`HandlerService - handleAgent - Invio richiesta Agent con modello ${inputData.config?.modelname}`);

            const { question, keyconversation, config }: DataRequest = inputData;
            return this.llmSenderService.senderToAgent(question!, keyconversation, config, systemPrompt, tools, middleware, nomeagente);

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

        this.logger.info(`HandlerService - getDataByResponseHttp - Preparazione dati per contesto ${context} e identificatore ${identifier}`);

        await preprocessor(req);

        //step 0. Recupero body in formato RequestBody
        let body = req.body as RequestBody;

        //step 1. Recupero informazioni di default
        let inputData = this.converterModels.getDataRequestDFL();

        //step 2. Recupero del systemprompt dalla logica esistente
        const systemPrompt = (context != ENDPOINT_CHATGENERICA) ? await this.readerPromptService.getFrameworkPrompts(context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto
        console.log("System prompt : " + systemPrompt);

        console.log("Identificativo chiamante: ", identifier);

        //recupero del requestbody
        let updateData: DataRequest = this.converterModels.getDataRequest(body, context, identifier, isAgent);

        // Merge di inputData con updatedData (updatedData sovrascrive in caso di conflitti)
        const resultData: DataRequest = {
            ...inputData,
            ...updateData
        };

        return { systemPrompt, resultData };
    }
}