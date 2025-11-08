/**
 * Request body riconosciuta dalle rest endpoint applicativo
 */
export interface RequestBody {
    text: string;                 //Campo standard usato come input come ad esempio da cheshirecat
    question: string;             // Domanda inviata dall'utente , tuttavia puo essere presente nel campo text
    modelname?: string;           // Nome del modello (predefinito a "llama" se non specificato)
    temperature?: number;         // Valore della temperatura per il modello (default: 0.1)
    sessionchat?: string;         // Identificativo della sessione (default: "defaultsession" se non presente)
    maxTokens?: number;           // Numero massimo di token (default: 8032)
    numCtx?: number;              // Numero massimo di contesto (default: 8032)
    //parametro introdotto per disabilitare l'append della conversazione.
    //cheshire ad esempio gestisce nativamente le conversazioni e non e' necessario, anzi sconsigliato, gestire l'append da chainprompt
    noappendchat?: boolean;

}