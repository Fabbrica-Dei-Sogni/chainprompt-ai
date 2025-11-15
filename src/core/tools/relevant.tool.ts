import { Tool } from "@langchain/core/tools";
import type { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.interface.js";
import { LLMProvider } from "../models/llmprovider.enum.js";
import { getAgent, invokeAgent } from "../services/agents/agent.service.js";
import { handleToolErrors, createSummaryMemoryMiddleware } from "../services/agents/middleware.service.js";
import { getFrameworkPrompts } from "../services/business/reader-prompt.service.js";
import { ENDPOINT_CHATGENERICA, SYSTEMPROMPT_DFL } from "../services/common.services.js";
import { AgentOutput } from "../interfaces/agentoutput.interface.js";
import { extractAgentManagerFinalReturn } from "../services/reasoning/llm-sender.service.js";

/**
 * Classe Tool LangChain che effettua similarity search su pgvector,
 * restituendo i tool più pertinenti rispetto alla query utente.
 */
export class RelevantTool extends Tool {
    vectorStore: PGVectorStore;
    name = "relevant_tool_selector";
    description = "Restituisce i tool più rilevanti rispetto al testo utente usando la ricerca vettoriale.";

    private config: ConfigChainPrompt;
    private provider: LLMProvider;
    private keyConversation: string;

    constructor(provider: LLMProvider, keyConversation: string, config: ConfigChainPrompt, vectorStore: PGVectorStore) {
        super();

        this.vectorStore = vectorStore;
        this.name = "relevant_tool_selector";
        this.description = 
            "Restituisce i tool agent più rilevanti rispetto al testo utente usando la ricerca vettoriale. Se lo trova allora esegue l'agente associato a quel tool dinamicamente. Figo eh!";

        this.provider = provider;
        this.keyConversation = keyConversation;
        this.config = config;
    }

    protected async _call(arg: string | undefined): Promise<AgentOutput> {

        //TODO: mettere a fattor comune una implementazione per tutti i _call
        console.info(
            `Argomenti : "${arg}":\n` +
            `SubAgent Info:\n` +
            `name: ${this.name}\n` +
            `description: ${this.description}\n`
        );

        if (!arg) {
            console.log("Argument risulta vuoto");
            throw "fail";
            //throw new Error("Argomenti vuoti");
        }
        const question = arg;

        try {
            const result = await this.retrieveRelevantTools(question);
            let context = this.getFirstToken(result);

            const middleware = [handleToolErrors, createSummaryMemoryMiddleware(this.config.modelname!) /*, dynamicSystemPrompt*/];

            //step 2. Recupero del systemprompt dalla logica esistente
            const systemPrompt = (context != ENDPOINT_CHATGENERICA) ? await getFrameworkPrompts(context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto
            console.log("System prompt : " + systemPrompt);

            const agent = getAgent(this.config, this.provider, systemPrompt, [], middleware, context);

            try {
                let keyconversation = this.keyConversation + "_" + "subAgent" + "_" + context;
                const result = invokeAgent(agent, question, keyconversation);
                return extractAgentManagerFinalReturn(result);
            } catch {
                throw `Errore durante l'esecuzione del sub agente ${agent.graph.getName()}`;
            }

            //return JSON.stringify(result);
        } catch {
            throw `Errore durante l'esecuzione del tool ${this.name}`;
        }
    }

    getFirstToken(str: string) {
        return str.split('.')[0];
    }
    /**
     * Esegue la similarity search sul vector store e restituisce i top tool.
     * @param query - testo domanda utente
     * @param k - numero tool da restituire (default 3)
     */
    async retrieveRelevantTools(query: string, k: number = 3): Promise<string> {
        const results = await this.vectorStore.similaritySearch(query, k);
        // Risposta strutturata come JSON array
        const simplified = results.map(r => ({
            name: r.metadata?.name ?? "tool",
            description: r.pageContent,
            // Puoi aggiungere altri campi utili (es. id, categoria)
        }));
        return simplified[0].description;
    }
}
