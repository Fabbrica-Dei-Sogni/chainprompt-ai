/**
 * Interfaccia per configurare i vari modelli llm supportati e usati dall'applicazione chainprompt.
 * I parametri potrebbero aumentare a seconda l'evoluzione applicativa.
 */
export interface ConfigChainPrompt {
    temperature?: number;
    modelname?: string;
    maxTokens?: number;
    numCtx?: number;
    //XXX candidati nuovi parametri: saranno eventualmente messi a configurazione
    numBatch?: number;
    topK?: number;
    repeatPenalty?: number;
    topP?: number;

    //parametro valido solo per il provider Ollama e ChatOllama
    format?: string;

    //XXX: parametri da capire e sperimentare
    keepAlive?: String;
    logitsAll?: boolean;
}