import { Tool } from "@langchain/core/tools";
import type { PGVectorStore } from "@langchain/community/vectorstores/pgvector";

/**
 * Classe Tool LangChain che effettua similarity search su pgvector,
 * restituendo i tool più pertinenti rispetto alla query utente.
 */
export class RelevantTool extends Tool {
    vectorStore: PGVectorStore;
    name = "relevant_tool_selector";
    description = "Restituisce i tool più rilevanti rispetto al testo utente usando la ricerca vettoriale.";

    constructor(vectorStore: PGVectorStore, name?: string, description?: string) {
        super();

        this.vectorStore = vectorStore;
        this.name = name || "relevant_tool_selector";
        this.description = description ||
            "Restituisce i tool più rilevanti rispetto al testo utente usando la ricerca vettoriale.";
    }

    protected async _call(arg: string | undefined): Promise<string> {

        //TODO: mettere a fattor comune una implementazione per tutti i _call
        console.info(
        `Argomenti : "${arg}":\n` +    
        `SubAgent Info:\n` +
        `name: ${this.name}\n` +
        `description: ${this.description}\n`
        );  
        
        if (!arg) throw new Error("Serve un URL in input.");
        // Decodifica URI da base64
        const url = arg.trim();
        try {
            const result = await this.retrieveRelevantTools(arg);
            return JSON.stringify(result);
        } catch {
            return `Errore durante lo scraping del link ${url}`;
        }
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
        return JSON.stringify(simplified);
    }
}
