import { LLMProvider } from "../models/llmprovider.enum.js";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";
import { getInstanceLLM } from "./llm-chain.service.js";
import { DataRequest } from "../interfaces/datarequest.js";
import { createAgent, createMiddleware, dynamicSystemPromptMiddleware, ReactAgent, summarizationMiddleware, Tool, ToolMessage } from "langchain"; // Per agent react moderno in 1.0
import * as z from "zod";
import '../../logger.js';
import { MemorySaver, MessagesZodState } from "@langchain/langgraph";

//Questo codice è stato realizzato seguendo le linee guida di langchain 
//https://docs.langchain.com/oss/javascript/langchain/agents

//https://docs.langchain.com/oss/javascript/langchain/short-term-memory
//il checkpointer piu semplice definito in memory
export const checkpointer = new MemorySaver();


/**
 * Gestione errore dei tool
 */
const handleToolErrors = createMiddleware({
    name: "HandleToolErrors",
    wrapToolCall: (request, handler) => {
        try {
            return handler(request);
        } catch (error) {
            // Return a custom error message to the model
            return new ToolMessage({
                content: `Tool error: Please check your input and try again. (${error})`,
                tool_call_id: request.toolCall.id!,
            });
        }
    },
});

/**
 * Metodo per eseguire un summary nativamente usando il modello supportato dal provider (lo stesso ma in futuro parametrizzabile)
 * @param modelname 
 * @returns 
 */
function createSummaryMemoryMiddleware(modelname: string, maxTokensBeforeSummary: number = 4000, messagesToKeep: number = 20) {
    const result = summarizationMiddleware({
        model: modelname,
        maxTokensBeforeSummary,
        messagesToKeep,
    });

    return result;
};

/**
 * Crea un agente con specifiche caratteristiche dell'llm , il provider di accesso, il contesto tematico, eventuali tools
 * @param inputData 
 * @param provider 
 * @param context 
 * @param tools 
 * @returns 
 */
export async function getAgent(context: string, inputData: DataRequest, provider: LLMProvider, systemPrompt: string, tools: Tool[] = []) {

    //step 0: recupera i dati necessari dal datarequest 
    const { temperature, modelname, maxTokens, numCtx, format }: DataRequest = inputData;
    let config: ConfigChainPrompt = {
        temperature, modelname, maxTokens, numCtx, format
    };

    //step 1: imposta il nome e la descrizione in modo dinamico a seconda il contesto tematico entrante.
    let name = "Mr. " + context;
    let description = name + " ha lo scopo di soddisfare il tema " + context;

    //step 2: istanza llm in base al provider e alla configurazione richiesta
    const llm = getInstanceLLM(provider, config);

    // 3. Crea l'agent con prompt custom
    const agent = createAgent({
        model: llm,
        tools,
        name,
        description,
        middleware: [handleToolErrors, createSummaryMemoryMiddleware(modelname!) /*, dynamicSystemPrompt*/] as const,
        systemPrompt: systemPrompt,
        //XXX: serve per inserire una short memory
        //studiarne meglio il suo funzionamento e integrazione
        checkpointer,
        includeAgentName: "inline",
    });

    return agent;
}

export async function invokeAgent(agent: ReactAgent, question: string, sessionId: string) {
    try {

        console.info("Identificativo " + sessionId + " sta interagendo con l'agente...");
        console.info("Invio richiesta all'agente: " + question);

        const result = await agent.invoke(
            { messages: [{ role: "user", content: question }] },
            { configurable: { thread_id: sessionId } }
            //{ context: { userRole: "expert" } }
        );

        return result;
    } catch (error) {
        console.error("Errore durante l'invocazione dell'agente:", error);
        // Puoi personalizzare il messaggio di errore per l'utente qui
        throw {
            error: true,
            message: "Si è verificato un errore nella comunicazione con l'agente. Riprova più tardi.",
            details: error instanceof Error ? error.message : String(error),
        };
    }
}

//XXX: Sezione da studiare e approfondire per snocciolare gli step lineari del loro utilizzo in ambiti complessi.

//esempio per fornire uno schema all'agente
/**
An optional schema for the context. 
It allows to pass in a typed context object into the agent invocation 
and allows to access it in hooks such as prompt and middleware.
As opposed to the agent state, defined in stateSchema, the context is not persisted between agent invocations.
 */
const contextSchema = z.object({
    userRole: z.enum(["expert", "beginner"]),
});

//un output strutturato e' possibile solo con llm che lo supportano
const genericAgentOutputSchema = z.object({
    summary: z.string().describe("Riassunto conciso dell'analisi o risposta finale."),
    data: z.object({}).passthrough().describe("Dati estratti o tool results, in formato libero o strutturato."),
    actions: z.array(z.object({
        type: z.string().describe("Tipo di azione (es. tool call, recommendation)."),
        details: z.string().optional().describe("Dettagli specifici."),
    })).optional().describe("Azioni eseguite o raccomandate."),
    confidence: z.number().min(0).max(1).optional().describe("Livello di confidenza (0-1)."),
    errors: z.array(z.string()).optional().describe("Eventuali errori rilevati."),
});

// Definisci il prompt template (system + user + placeholder per tool output)
//XXX: verra definito nella cartella dei prompt
const systemPromptDFL = `Sei un agente scaltro`;
/**
 * Esempio di applicazione dinamica del system prompt
 */
const dynamicSystemPrompt = dynamicSystemPromptMiddleware<z.infer<typeof contextSchema>>((state, runtime) => {
    const userRole = runtime.context.userRole || "user";
    const basePrompt = systemPromptDFL;

    if (userRole === "expert") {
        return `${basePrompt} Provide detailed technical responses.`;
    } else if (userRole === "beginner") {
        return `${basePrompt} Explain concepts simply and avoid jargon.`;
    }
    return basePrompt;
});

/**
 * Stato della memoria dell'agente in modo che ci siano userPreferences, ma anche altro.
 da studiare meglio
 */
 /**
An optional schema for the agent state.
It allows you to define custom state properties that persist across agent invocations and can be accessed in hooks, middleware, and throughout the agent's execution.
The state is persisted when using a checkpointer and can be updated by middleware or during execution.
As opposed to the context (defined in contextSchema), the state is persisted between agent invocations when using a checkpointer, 
making it suitable for maintaining conversation history, user preferences, or any other data that should persist across multiple interactions. 
  */
const customAgentState = z.object({
    messages: MessagesZodState.shape.messages,
    userPreferences: z.record(z.string(), z.string()),
});

//Prototipo di istanza agent con le varie configurazioni piu importanti
/**
    // Strategia per output strutturato generico
    //XXX: necessita di un llm che lo supporta
    //const responseFormat = providerStrategy(genericAgentOutputSchema);

    const agent = createAgent({
        model: llm,
        tools,
        name,
        description,
        //contextSchema: contextSchema,
        middleware: [handleToolErrors, createSummaryMemoryMiddleware(modelname!) , dynamicSystemPrompt] as const,
        systemPrompt: systemPrompt,

        //XXX: serve per inserire una short memory
        //studiarne meglio il suo funzionamento e integrazione
        checkpointer,

        includeAgentName: "inline",
        
        //lo schema deve essere ben tipizzato per essere poi invocato dall'invoke
        //stateSchema: customAgentState,
        //contextSchema

        //solo su llm supportati
        //responseFormat
    });

 */