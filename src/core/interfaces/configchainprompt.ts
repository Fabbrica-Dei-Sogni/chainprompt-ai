export interface ConfigChainPrompt {
    systemprompt?: string,
    question?: string,
    temperature?: number,
    modelname?: string,
    maxTokens?: number,
    numCtx?: number
}