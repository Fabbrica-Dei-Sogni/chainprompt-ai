import { Tool } from "@langchain/core/tools";
import { scrapeArticle } from "../utils/clickbaitscore.util.js";

// Tool che usa la funzione di scraping
export class ScrapingTool extends Tool {
    name = "scraping_tool";
    description = "Effettua scraping di articoli da URL e restituisce titolo e contenuto pulito.";

    protected async _call(arg: string | undefined): Promise<string> {
        if (!arg) throw new Error("Serve un URL in input.");
        // Decodifica URI da base64
            const url = arg.trim();
        try {
            const result = await scrapeArticle(url);
            return JSON.stringify(result);
        } catch {
            return `Errore durante lo scraping del link ${url}`;
        }
    }
}