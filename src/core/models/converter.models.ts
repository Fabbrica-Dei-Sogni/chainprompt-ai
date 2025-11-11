import { DataRequest } from "../interfaces/datarequest.js";
import { RequestBody } from "../interfaces/requestbody.js";

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

    //XXX: costruzione dell'identificativo di sessione
    let keyconversation = session+"_"+identifier + "_" + context;
    //identificativo indirizzato a un agente piuttosto che a una chat conversazionale 
    //(capire se in futuro ha senso questa distinzione)
    if (isAgent)
        keyconversation = keyconversation + "_agent";
    else
        keyconversation = keyconversation + "_chat";


    console.log("Avviata conversione con chiave : " + keyconversation);
    console.log("Domanda richiesta: " + question);
    console.log("Modello llm utilizzato : " + modelname);
    console.log("temperature impostata a " + temperature);


    return { question, temperature, modelname, maxTokens, numCtx, keyconversation, noappendchat };
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


    return { question, temperature, modelname, maxTokens, numCtx, keyconversation, noappendchat, format };
}