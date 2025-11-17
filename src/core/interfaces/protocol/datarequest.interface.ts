import { ConfigChainPrompt } from "./configchainprompt.interface.js";

/**
 * L'interfaccia rappresenta i valori che sono recuperati dalla request di un chiamante
 * Rappresenta il json inviato dal chiamante per interrogare il chainprompt ai

    keyconversation: string;
    question?: string;
    modelname?: string;
    temperature?: number;
    maxTokens?: number;
    numCtx?: number;
    format?: string;           //parametro valido solo per il provider Ollama e ChatOllama
    noappendchat?: boolean;    //parametro introdotto per disabilitare l'append della conversazione.
                               //cheshire ad esempio gestisce nativamente le conversazioni e non e' necessario, anzi sconsigliato, gestire l'append da chainprompt

 * 
in questo bean sono definiti i parametri necessari per le request da fornire ai provider llm 
tali informazioni possono essere recuperate da chiamanti afferenti a protocolli di comunicazione diversi
protocollo http (l'unico implementato con l'interfaccia @RequestBody), socket.io, websocket, altri...
 */
export interface DataRequest {
    keyconversation: string;
    question?: string;
    noappendchat?: boolean;    //parametro introdotto per disabilitare l'append della conversazione.
                               //cheshire ad esempio gestisce nativamente le conversazioni e non e' necessario, anzi sconsigliato, gestire l'append da chainprompt
    config: ConfigChainPrompt;
}
