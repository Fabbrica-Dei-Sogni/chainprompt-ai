import { StructuredTool } from "@langchain/core/tools";
import z from "zod";
import { scrapeArticle } from "../utils/clickbaitscore.util.js";

/**
 * Questo structured tool e' da considerarlo come un template logico per realizzarne altri con schemi contenenti informazioni intrinsechi della richiesta in base al tema
 */

export interface ScrapingTooolInput {
  url: string;
}

export const scrapingToolSchema = z.object({
  url: z.string().describe("Un url http"),
});

// Tool che usa la funzione di evocazione di un agente tematico come tool a disposizione di un agente
export class ScrapingToolStructured extends StructuredTool<typeof scrapingToolSchema> {

  name = "scraping_tool_structured";
  description = "Effettua scraping di articoli da URL e restituisce titolo e contenuto pulito.";
  schema = scrapingToolSchema;

  protected async _call(arg: ScrapingTooolInput): Promise<string> {

    console.info(
      `Argomenti : "${arg}":\n` +
      `SubAgent Info:\n` +
      `name: ${this.name}\n` +
      `description: ${this.description}\n`
    );

    if (!arg.url) throw new Error("Serve un URL in input.");
    // Decodifica URI da base64
    const url = arg.url;
    try {
      const result = await scrapeArticle(url);
      return JSON.stringify(result);
    } catch {
      return `Errore durante lo scraping del link ${url}`;
    }
  }
}