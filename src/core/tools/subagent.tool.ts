import { Tool } from "@langchain/core/tools";
import { getAgent, invokeAgent } from "../services/agents/agent.service.js";
import { ENDPOINT_CHATGENERICA, SYSTEMPROMPT_DFL } from "../services/common.services.js";
import { getFrameworkPrompts } from "../services/business/reader-prompt.service.js";
import { handleToolErrors, createSummaryMemoryMiddleware } from "../services/agents/middleware.service.js";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.interface.js";
import { LLMProvider } from "../models/llmprovider.enum.js";
import { extractAgentManagerFinalReturn } from "../services/reasoning/llm-sender.service.js";
import { AgentOutput } from "../interfaces/agentoutput.interface.js";

// Tool che usa la funzione di evocazione di un agente tematico come tool a disposizione di un agente
export class SubAgentTool extends Tool {

    private config: ConfigChainPrompt;
    private context: string;
    private provider: LLMProvider;
    private keyConversation: string;

    constructor(nomeagente: string, context: string, systemprompt: string, provider: LLMProvider, keyConversation: string, config: ConfigChainPrompt) {
        super();
        this.name = nomeagente;

        let description = `
        Sei un sub agente di nome ${nomeagente} incaricato di eseguire quanto segue:
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

    protected async _call(arg: string | undefined): Promise<AgentOutput> {

        console.info(
        `Argomenti : "${arg}":\n` +    
        `SubAgent Info:\n` +
        `name: ${this.name}\n` +
        `description: ${this.description}\n` +
        `context: ${this.context}\n` +
        `provider: ${this.provider}\n` +
        `keyConversation: ${this.keyConversation}\n` +
        `config: ${JSON.stringify(this.config)}`
        );  
        
        if (!arg) {
            console.log("Argument risulta vuoto");
            throw "fail";
            //throw new Error("Argomenti vuoti");
        }
        const question = arg;

        const middleware = [handleToolErrors, createSummaryMemoryMiddleware(this.config.modelname!) /*, dynamicSystemPrompt*/];

        //step 2. Recupero del systemprompt dalla logica esistente
        const systemPrompt = (this.context != ENDPOINT_CHATGENERICA) ? await getFrameworkPrompts(this.context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto
        console.log("System prompt : " + systemPrompt);

        const agent = getAgent(this.config, this.provider, systemPrompt, [], middleware, this.context);

        try {
            let keyconversation = this.keyConversation+"_"+"subAgent"+"_"+this.context;
            const result = invokeAgent(agent, question, keyconversation);
            return extractAgentManagerFinalReturn(result);
        } catch {
            throw `Errore durante l'esecuzione del sub agente ${agent.graph.getName()}`;
        }
    }
}