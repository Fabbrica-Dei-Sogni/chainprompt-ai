import { Tool } from "@langchain/core/tools";
import { ReactAgent } from "langchain";
import { getAgentContent } from "../../core/converter.models.js";
import { invokeAgent } from "../../core/services/llm-agent.service.js";

// Tool che usa la funzione di evocazione di un agente tematico come tool a disposizione di un agente
export class SubAgentTool extends Tool {

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

    protected async _call(arg: string | undefined): Promise<string> {

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
            const result = invokeAgent(this.agent, question, keyconversation);
            return getAgentContent(result);
        } catch {
            throw `Errore durante l'esecuzione del sub agente ${this.agent.graph.getName()}`;
        }
    }
}