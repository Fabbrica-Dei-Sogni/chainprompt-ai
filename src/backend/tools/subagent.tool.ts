import { StructuredTool, Tool } from "@langchain/core/tools";
import { ReactAgent } from "langchain";
import { converterModels } from "../../core/converter.models.js";
import { llmAgentService } from "../../core/services/llm-agent.service.js";
import z from "zod";

export interface SubAgentInput {
    question: string;
}
export const subAgentInputSchema = z.object({
    question: z.string().describe("La domanda da porre all'agente esperto nel campo"),
});

// Tool che usa la funzione di evocazione di un agente tematico come tool a disposizione di un agente
export class SubAgentTool extends StructuredTool<typeof subAgentInputSchema> {

    name = "Mr Scagnozzo";
    description = "Sono il tool che avvia un agente associato al contesto richiesto, con una domanda pertinente, e altri metadati come il provider";
    schema = subAgentInputSchema;
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

    protected async _call(arg: SubAgentInput): Promise<string> {

        console.info(
            `Domanda inoltrata : "${JSON.stringify(arg)}":\n` +
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
        const question = arg.question;

        try {
            let keyconversation = this.keyConversation + "_" + "subAgent" + "_" + this.context;
            const result = await llmAgentService.invokeAgent(this.agent, question, keyconversation);
            return converterModels.getAgentContent(result);
        } catch {
            throw `Errore durante l'esecuzione del sub agente ${this.agent.graph.getName()}`;
        }
    }
}