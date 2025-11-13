import { StructuredTool } from "@langchain/core/tools";
import { getAgent, invokeAgent } from "../services/agents/agent.service.js";
import { ENDPOINT_CHATGENERICA, SYSTEMPROMPT_DFL } from "../services/common.services.js";
import { getFrameworkPrompts } from "../services/business/reader-prompt.service.js";
import { handleToolErrors, createSummaryMemoryMiddleware } from "../services/agents/middleware.service.js";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";
import { LLMProvider } from "../models/llmprovider.enum.js";
import z from "zod";

export interface SubAgentToolInput {
    config: ConfigChainPrompt;
    provider: LLMProvider;
    modelname: string;
    context: string;
    question: string;
    // altri parametri opzionali se servono
}

// 1. Schema per ConfigChainPrompt con describe
export const ConfigChainPromptSchema = z.object({
  temperature: z
    .number()
    .optional()
    .describe("Il valore di temperature"),
  modelname: z
    .string()
    .optional()
    .describe("Il valore di modelname"),
  maxTokens: z
    .number()
    .optional()
    .describe("Il valore di maxTokens"),
  numCtx: z
    .number()
    .optional()
    .describe("Il valore di numCtx")
});

// 2. Schema per SubAgentToolInput con describe
export const SubAgentToolInputSchema = z.object({
  config: ConfigChainPromptSchema.describe(
    "Configurazione opzionale e avanzata della generazione per il provider e il modello"
  ),
  provider: z
    .nativeEnum(LLMProvider)
    .describe("Il valore di provider"),
  context: z
    .string()
    .describe("Il valore di context"),
  question: z
    .string()
    .describe("Domanda esplicita che il subagent/strumento deve affrontare")
});

// Tool che usa la funzione di evocazione di un agente tematico come tool a disposizione di un agente
export class SubAgentTool extends StructuredTool<typeof SubAgentToolInputSchema> {

    private config: ConfigChainPrompt;
    private context: string;
    private provider: LLMProvider;
    private keyConversation: string;

    constructor(nomeagente: string, context: string, systemprompt: string, provider: LLMProvider, keyConversation: string, config: ConfigChainPrompt) {
        super();
        this.name = nomeagente;

        let description = `
        Sei un sub agente di nome ${nomeagente}, che deve avere le informazioni di question, context, provider, temperature, modelname, maxTokens, numCtx che il chiamante possiede.

        ${systemprompt}
        `;
        this.context = context;
        this.provider = provider;
        this.description = description;
        this.keyConversation = keyConversation;
        this.config = config;
    }

    name = "Mr Scagnozzo";
    description = "Sono il tool che avvia un agente associato al contesto richiesto, con una domanda pertinente, e altri metadati come il provider";
    schema = SubAgentToolInputSchema;

    protected async _call(arg: SubAgentToolInput): Promise<string> {
        if (!arg) {
            console.log("Argument risulta vuoto");
            return "fail";
            //throw new Error("Argomenti vuoti");
        }
        const { question } = arg;

        const middleware = [handleToolErrors, createSummaryMemoryMiddleware(this.config.modelname!) /*, dynamicSystemPrompt*/];

        //step 2. Recupero del systemprompt dalla logica esistente
        const systemPrompt = (this.context != ENDPOINT_CHATGENERICA) ? await getFrameworkPrompts(this.context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto
        console.log("System prompt : " + systemPrompt);

        const agent = getAgent(this.config, this.provider, systemPrompt, [], middleware, this.context);

        try {
            let keyconversation = this.keyConversation+"_"+"subAgent"+"_"+this.context;
            const result = invokeAgent(agent, question, keyconversation);
            return JSON.stringify(result);
        } catch {
            return `Errore durante l'esecuzione del sub agente ${agent.graph.getName()}`;
        }
    }
}