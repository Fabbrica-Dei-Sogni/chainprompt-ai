
import { wrapperServerLLM } from '../controllers/commons/wrapperllm.controller.js'
import { DataRequest } from "../interfaces/datarequest.js";
import { RequestBody } from '../interfaces/requestbody.js';

const handle = async (ipAddress: any, data : any, contextchat: any, getSendPromptCallback: any): Promise<any> => {
    try {
        console.log("Indirizzo ip: ", ipAddress);
        const inputData: DataRequest = extractDataFromRequest(data, contextchat, ipAddress);

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

    //Recupero della domanda dal campo question o dal campo text (standard cheshire)
    var inputvalue = body.question ?? body.text;
    const question = '\n' + inputvalue;

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
    const noappendchat = body.noappendchat || false;



    return { question, temperature, modelname, maxTokens, numCtx, keyconversation, noappendchat };
}

export {
    handle
};