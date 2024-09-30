/**
 * L'interfaccia rappresenta i valori che sono recuperati dalla request di un chiamante
 * Rappresenta il json inviato dal chiamante per interrogare il chainprompt ai
 * 
 * i parametri potrebbero evolvere
 */
export interface DataRequest {
    keyconversation: string;
    question?: string;
    modelname?: string;
    temperature?: number;
    maxTokens?: number;
    numCtx?: number;
    //parametro introdotto per disabilitare l'append della conversazione.
    //cheshire ad esempio gestisce nativamente le conversazioni e non e' necessario, anzi sconsigliato, gestire l'append da chainprompt
    noappendchat?: boolean;
}