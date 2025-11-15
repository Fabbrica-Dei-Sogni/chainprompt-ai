import { LLMProvider } from "../../../models/llmprovider.enum.js";
import { ConfigChainPrompt } from "../../../interfaces/configchainprompt.interface.js";
import { AgentMiddleware, dynamicSystemPromptMiddleware, StructuredTool, Tool } from "langchain"; // Per agent react moderno in 1.0
import * as z from "zod";
import '../../../../logger.js';
import { MessagesZodState } from "@langchain/langgraph";
import { createSummaryMemoryMiddleware, handleToolErrors } from "./middleware.service.js";
import { ENDPOINT_CHATGENERICA, SYSTEMPROMPT_DFL } from "../../common.services.js";
import { getFrameworkPrompts } from "../reader-prompt.service.js";
import { getAgent } from "../../reasoning/llm-agent.service.js";

//Questo codice è stato realizzato seguendo le linee guida di langchain 
//https://docs.langchain.com/oss/javascript/langchain/agents

//https://docs.langchain.com/oss/javascript/langchain/short-term-memory
//il checkpointer piu semplice definito in memory
//const checkpointer = getCheckpointer();//new MemorySaver();


 /**
  * 
  * Costruisce un agente a partire dal contesto, configurazione
  * @param context 
  * @param config 
  * @param provider 
  * @param modelname 
  * @param middleware 
  * @returns 
  */
export async function buildAgent(
    context: string,
    config: ConfigChainPrompt,
    provider: LLMProvider,
    tools: Tool[] | StructuredTool[] = [],
    middleware: AgentMiddleware[] = [handleToolErrors, createSummaryMemoryMiddleware(config.modelname!) /*, dynamicSystemPrompt*/]) {

  //step 2. Recupero del systemprompt dalla logica esistente
  const systemPrompt = (context != ENDPOINT_CHATGENERICA) ? await getFrameworkPrompts(context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto
  //console.log("System prompt : " + systemPrompt);
  const agent = getAgent(config, provider, systemPrompt, tools, middleware, context);
  return agent;
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