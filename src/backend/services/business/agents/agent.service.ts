import { ConfigChainPrompt } from "../../../../core/interfaces/protocol/configchainprompt.interface.js";
import { AgentMiddleware, dynamicSystemPromptMiddleware, StructuredTool, Tool } from "langchain"; // Per agent react moderno in 1.0
import * as z from "zod";
import '../../../logger.backend.js';
import { MessagesZodState } from "@langchain/langgraph";
import { middlewareService } from "./middleware.service.js";
import { readerPromptService } from "../reader-prompt.service.js";
import { ENDPOINT_CHATGENERICA, SYSTEMPROMPT_DFL } from "../../common.service.js";
import { postgresqlService } from "../../databases/postgresql/postgresql.service.js";
import { getComponent } from "../../../../core/di/container.js";
import { LLMAgentService } from "../../../../core/services/llm-agent.service.js";
import { LLMChainService } from "../../../../core/services/llm-chain.service.js";
//recupero dell'istanza del servizio LLM Embeddings tramite DI sul container del core
const llmAgentService = getComponent(LLMAgentService);
const llmChainService = getComponent(LLMChainService);

//Questo codice è stato realizzato seguendo le linee guida di langchain 
//https://docs.langchain.com/oss/javascript/langchain/agents

//https://docs.langchain.com/oss/javascript/langchain/short-term-memory
//il checkpointer piu semplice definito in memory
//const checkpointer = getCheckpointer();//new MemorySaver();

export class AgentService {
    private static instance: AgentService;

    private constructor() { }

    public static getInstance(): AgentService {
        if (!AgentService.instance) {
            AgentService.instance = new AgentService();
        }
        return AgentService.instance;
    }

    /**
     * 
     * Costruisce un agente a partire dal contesto, configurazione
     * @param context 
     * @param config 
     * @param modelname 
     * @param middleware 
     * @returns 
     */
    public async buildAgent(
        context: string,
        config: ConfigChainPrompt,
        tools: Tool[] | StructuredTool[] = [],
        middleware: AgentMiddleware[] = [middlewareService.handleToolErrors, middlewareService.createSummaryMemoryMiddleware(config.modelname!) /*, dynamicSystemPrompt*/]) {

        //step 2. Recupero del systemprompt dalla logica esistente
        const systemPrompt = (context != ENDPOINT_CHATGENERICA) ? await readerPromptService.getFrameworkPrompts(context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto
        //console.log("System prompt : " + systemPrompt);
        const agent = llmAgentService.getAgent(llmChainService.getInstanceLLM(config), systemPrompt, tools, middleware, "Mr." + context, postgresqlService.getCheckpointer());
        return agent;
    }
}

export const agentService = AgentService.getInstance();


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
 * da studiare meglio
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