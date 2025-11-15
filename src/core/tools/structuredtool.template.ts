import { StructuredTool } from "@langchain/core/tools";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.interface.js";
import { LLMProvider } from "../models/llmprovider.enum.js";
import z from "zod";
import { ReactAgent } from "langchain";
import { getAgentContent } from "../models/converter.models.js";
import { invokeAgent } from "../services/reasoning/llm-agent.service.js";

/**
 * Questo structured tool e' da considerarlo come un template logico per realizzarne altri con schemi contenenti informazioni intrinsechi della richiesta in base al tema
 */

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

    name = "Mr Scagnozzo";
    description = "Sono il tool che avvia un agente associato al contesto richiesto, con una domanda pertinente, e altri metadati come il provider";

    private context: string;
    private keyConversation: string;
    private agent: ReactAgent;

    constructor(agent: ReactAgent, nomeagente: string, context: string, systemprompt: string, keyConversation: string,) {
        super();
        this.name = nomeagente;

        let description = `
        Sei un sub agente di nome ${nomeagente} incaricato di eseguire quanto segue:
        ${systemprompt}
        `;
        this.context = context;
        this.description = description;
        this.keyConversation = keyConversation;
        this.agent = agent;
    }
    schema = SubAgentToolInputSchema;

    protected async _call(arg: SubAgentToolInput): Promise<string> {
        
        console.info(
        `Argomenti : "${arg}":\n` +    
        `SubAgent Info:\n` +
        `name: ${this.name}\n` +
        `description: ${this.description}\n` +
        `context: ${this.context}\n` +
        `keyConversation: ${this.keyConversation}\n` 
        );  
        
        if (!arg) {
            console.log("Argument risulta vuoto");
            throw "fail";
        }
        const question = arg;

        try {
            let keyconversation = this.keyConversation+"_"+"subAgent"+"_"+this.context;
            const result = invokeAgent(this.agent, question.question, keyconversation);
            return getAgentContent(result);
        } catch {
            throw `Errore durante l'esecuzione del sub agente ${this.agent.graph.getName()}`;
        }
    }
}