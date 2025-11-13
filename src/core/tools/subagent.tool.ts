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

// 1. Schema per ConfigChainPrompt
export const ConfigChainPromptSchema = z.object({
    temperature: z.number().optional(),
    modelname: z.string().optional(),
    maxTokens: z.number().optional(),
    numCtx: z.number().optional(),
});

// 2. Schema per SubAgentToolInput
export const SubAgentToolInputSchema = z.object({
  config: ConfigChainPromptSchema,
  provider: z.nativeEnum(LLMProvider),
  context: z.string(),
  question: z.string(),
});

// Tool che usa la funzione di evocazione di un agente tematico come tool a disposizione di un agente
export class SubAgentTool extends StructuredTool<typeof SubAgentToolInputSchema> {

    constructor(nomeagente: string, systemprompt: string) {
        super();
        this.name = nomeagente;

        let description = `
        Sei un sub agente di nome ${nomeagente}, che deve avere le informazioni di question, context, provider, temperature, modelname, maxTokens, numCtx che il chiamante possiede.

        ${systemprompt}
        `;

        this.description = description;
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
        const { context, provider, question, modelname,  } = arg;

        //come posso inserire altri argomenti oltre alla question ? 
        let keyconversation = context + "_" + provider+ "_" + modelname;
        let config: ConfigChainPrompt = {
            temperature: arg.config.temperature, modelname, maxTokens : arg.config.maxTokens, numCtx: arg.config.numCtx
        };

        const middleware = [handleToolErrors, createSummaryMemoryMiddleware(modelname) /*, dynamicSystemPrompt*/];

        //step 2. Recupero del systemprompt dalla logica esistente
        const systemPrompt = (context != ENDPOINT_CHATGENERICA) ? await getFrameworkPrompts(context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto
        console.log("System prompt : " + systemPrompt);

        const agent = getAgent(config, provider, systemPrompt, [], middleware, context);

        try {
            const result = invokeAgent(agent, question, keyconversation);
            return JSON.stringify(result);
        } catch {
            return `Errore durante l'esecuzione del sub agente ${agent.graph.getName()}`;
        }
    }
}