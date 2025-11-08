import { Tool } from "@langchain/core/tools";


interface CyberInput {
    url: string;
    params: Record<string, any>;
}

interface CyberOutput {
    results: Array<Record<string, any>>;
}

export class CybersecurityAPITool extends Tool {
    name = "cybersecurity_api_tool";
    description = "Interroga API REST di cybersecurity e restituisce dati JSON.";

    // Implementa il metodo _call (protetto) richiesto da Tool base
    protected async _call(arg: string | undefined): Promise<string> {

        // Parse JSON input da stringa a oggetto tipizzato
        let input: CyberInput;
        try {
            input = arg ? JSON.parse(arg) : null;
        } catch {
            throw new Error("Input JSON non valido");
        }

        const query = new URLSearchParams(input.params as any).toString();
        const response = await fetch(`${input.url}?${query}`);
        if (!response.ok) throw new Error("Errore fetching dati da API");
        const json: CyberOutput = await response.json();
        return JSON.stringify(json);

    }
}
