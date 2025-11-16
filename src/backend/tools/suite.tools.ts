import { tool } from "langchain";
import { z } from "zod";
import { scrapeArticle } from "../../core/utils/clickbaitscore.util.js";

export const scrapingTool = tool(
    async ({ url }) => {

        if (!url) throw new Error("Serve un URL in input.");
        // Decodifica URI da base64
        url = url.trim();
        try {
            const result = await scrapeArticle(url);
            return JSON.stringify(result);
        } catch {
            return `Errore durante lo scraping del link ${url}`;
        }
        
    },

    {
        name: "scraping_tool",
        description: "Effettua scraping di articoli da URL e restituisce titolo e contenuto pulito.",

        schema: z.object({
            url: z.string().describe("Un url http"),
        }),
    }
);