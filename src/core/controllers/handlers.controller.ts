
import { wrapperServerLLM } from '../controllers/wrapperllm.controller.js'
import * as requestIp from 'request-ip';
import { DataRequest } from "../interfaces/datarequest.js";
import { RequestBody } from '../interfaces/requestbody.js';
/**
 * La classe rappresenta l'handler prompt comune a tutte le apis qui implementate. 
 questa tecnica vuole essere scalabile per introdurre features che utilizzano un llm per svolgere varie cose.
 */
const handlePrompt = async (req: any, contextchat: any, getSendPromptCallback: any): Promise<any> => {
    try {
        //        const originalUriTokens = req.originalUrl.split('/');
        //        const contextchat = originalUriTokens[originalUriTokens.length - 1];
        const ipAddress = requestIp.getClientIp(req);
        console.log("Indirizzo ip: ", ipAddress);
        const inputData: DataRequest = extractDataFromRequest(req.body, contextchat, ipAddress);

        let answer = await wrapperServerLLM(inputData, contextchat, getSendPromptCallback);

        return answer;
    } catch (err) {
        console.error('Errore durante la conversazione:', err);
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
function extractDataFromRequest(body: RequestBody, context: string, identifier: any): DataRequest {
    console.log("Estrazione informazioni data input per la preparazione al prompt di sistema....");

    const question = '\n' + body.question;
    console.log("Domanda ricevuta:", question);
    const modelname = body.modelname ? body.modelname : "llama";
    const temperature = body.temperature || 0.1;

    const sessionchat = body.sessionchat;
    const session = sessionchat ? sessionchat : "defaultsession";
    const keyconversation = identifier + "_" + context + "_" + session;
    console.log("Avviata conversione con chiave : " + keyconversation);

    //    const keyconversation = ipAddress + "_" + context;
    //console.log("Indirizzo ip: ", ipAddress);
    const maxTokens = body.maxTokens || 8032;
    const numCtx = body.numCtx || 8032;



    return { question, temperature, modelname, maxTokens, numCtx, keyconversation };
}

export {
    handlePrompt
};