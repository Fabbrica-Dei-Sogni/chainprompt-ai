import { AIMessage } from "langchain";
import { AgentOutput } from "./interfaces/agentoutput.interface.js";
import { ConfigChainPrompt } from "./interfaces/protocol/configchainprompt.interface.js";
import { ConfigEmbeddings } from "./interfaces/protocol/configembeddings.interface.js";
import { DataRequest } from "./interfaces/protocol/datarequest.interface.js";
import { RequestBody } from "./interfaces/protocol/requestbody.interface.js";
import { LLMProvider } from "./enums/llmprovider.enum.js";
import { logger } from "./logger.core.js"

/**
 * Recupera l'agent output da un risultato "grezzo" di una risposta ricevuta da un agente

 * @param agentResult 
 * @returns 
 */
// Funzione che estrae in modo robusto i dati finali dall’output dell’agent manager
function getAgentOutput(agentResult: any): AgentOutput {
    // Filtra i messaggi AIMessage (risposta del modello)
    const aiMessages = Array.isArray(agentResult.messages)
        ? agentResult.messages.filter((m: AIMessage) => m.type === "ai")
        : [];
    // Prende l’ultimo AIMessage (“risultato finale”)
    const lastAIMessage = aiMessages.length ? aiMessages[aiMessages.length - 1] : null;
    const finalContent = lastAIMessage?.content ?? "";

    // Dati usage (billing/monitoraggio), opzionali
    const usage = lastAIMessage?.usage_metadata ?? null;

    return {
        result: finalContent,
        trace: agentResult.messages ?? [],
        usage
    };
}

/**
 * Metodo getter per recuperare il content stringa da un agent result
 * @param agentResult 
 * @returns 
 */
export function getAgentContent(agentResult: any): string {
    return getAgentOutput(agentResult).result;
}

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
    logger.info("Estrazione informazioni data input per la preparazione al prompt di sistema....");

    //Recupero della domanda dal campo question o dal campo text (standard cheshire)
    const question = body.question ?? body.text;

    const provider = body.provider;

    //recupero del modelname o default
    const modelname = body.modelname;
    //recupero della temperature o default
    const temperature = body.temperature;
    //recupero della sessione o default
    const session = body.sessionchat;
    //recupero maxTokens o default
    const maxTokens = body.maxTokens;
    //recupero numCtx o default
    const numCtx = body.numCtx;
    //recupero richiesta storico o default
    const noappendchat = body.noappendchat;

    const format = body.format;

    const timeout = body.timeout;

    //XXX: costruzione dell'identificativo di sessione
    let keyconversation = session + "_" + identifier + "_" + context;
    //identificativo indirizzato a un agente piuttosto che a una chat conversazionale 
    //(capire se in futuro ha senso questa distinzione)
    if (isAgent)
        keyconversation = keyconversation + "_agent";
    else
        keyconversation = keyconversation + "_chat";

    let config: ConfigChainPrompt = {
        ...getConfigChainpromptDFL(), temperature, provider, modelname, maxTokens, numCtx, format, timeout
    };

    logger.info("Avviata conversione con chiave : " + keyconversation);
    logger.info("Domanda richiesta: " + question);
    logger.info("Provider utilizzato " + provider);
    logger.info("Modello llm utilizzato : " + modelname);
    logger.info("temperature impostata a " + temperature);


    return { question, keyconversation, noappendchat, config };
}

export function getConfigChainpromptDFL(): ConfigChainPrompt {

    return { timeout: 120000, provider: LLMProvider.ChatOllama, maxTokens: 8032, numCtx: 8032 };
}
/**
 * Definisce un data request con valori di default.
 In futuro i valori saranno persistiti su un database come mongodb per personalizzare i default in base alle tematiche. next soon
 * @returns 
 */
export function getDataRequestDFL(): DataRequest {
    console.log("Estrazione informazioni data input di default ...");

    const format = undefined; //parametro valido solo per ollama consigliato "json"
    //Recupero della domanda dal campo question o dal campo text (standard cheshire)
    const question = "Quale è la risposta ?";
    //recupero del modelname o default
    const modelname = "qwen3:0.6b";
    //recupero della temperature o default
    const temperature = 0.1;
    //recupero della sessione o default
    const session = "defaultsession";
    //recupero maxTokens o default
    const maxTokens = 8032;
    //recupero numCtx o default
    const numCtx = 8032;
    //recupero richiesta storico o default
    const noappendchat = false;

    //XXX: costruzione dell'identificativo di sessione
    let keyconversation = session;

    let config: ConfigChainPrompt = {
        ...getConfigChainpromptDFL(), temperature, modelname, maxTokens, numCtx, format
    };

    return { question, keyconversation, noappendchat, config };
}

export function getConfigEmbeddingsDFL(): ConfigEmbeddings {

    return {
        modelname: 'mxbai-embed-large',
        baseUrl: process.env.URI_LANGCHAIN_OLLAMA,
    }
}