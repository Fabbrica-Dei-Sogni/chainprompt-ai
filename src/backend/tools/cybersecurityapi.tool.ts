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

        //TODO: mettere a fattor comune una implementazione per tutti i _call
        console.info(
        `Argomenti : "${arg}":\n` +    
        `SubAgent Info:\n` +
        `name: ${this.name}\n` +
        `description: ${this.description}\n`
        );  
        
        if (!arg) {
            console.log("Argument risulta vuoto");
            return "fail";
            //throw new Error("Argomenti vuoti");
        }
        const question = arg;

        try {
            const result = "interroga la api del threatintel con un json ben formato e con i valori presenti nella domanda in input "+question;
            return JSON.stringify(result);
        } catch {
            return `Errore durante l'esecuzione del tool ${this.name}`;
        }

    }
}
