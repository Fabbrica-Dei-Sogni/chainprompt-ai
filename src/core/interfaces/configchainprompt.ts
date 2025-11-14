/**
 * Interfaccia per configurare i vari modelli llm supportati e usati dall'applicazione chainprompt.
 * I parametri potrebbero aumentare a seconda l'evoluzione applicativa.

 non tutti questi parametri sono previsti da DataRequest. 
 a seconda l'esigenza e verranno parametrizzati dove opportuno.
 TODO: gestire una logica di default efficace per questo insieme di parametri
 */
export interface ConfigChainPrompt {
    
    temperature?: number;
    modelname?: string;
    maxTokens?: number;
    numCtx?: number;
    format?: string;    //parametro valido solo per il provider Ollama e ChatOllama
    timeout?: number;

    //XXX candidati nuovi parametri: saranno eventualmente messi a configurazione
    numBatch?: number;
    topK?: number;
    repeatPenalty?: number;
    topP?: number;
    //XXX: parametri da capire e sperimentare
    keepAlive?: String;
    logitsAll?: boolean;
}