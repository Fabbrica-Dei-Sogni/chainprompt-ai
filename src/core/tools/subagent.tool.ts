import { Tool } from "@langchain/core/tools";
import { getAgent, invokeAgent } from "../services/agents/agent.service.js";
import { ENDPOINT_CHATGENERICA, SYSTEMPROMPT_DFL } from "../services/common.services.js";
import { getDataRequestDFL } from "../models/converter.models.js";
import { getFrameworkPrompts } from "../services/business/reader-prompt.service.js";
import { handleToolErrors, createSummaryMemoryMiddleware } from "../services/agents/middleware.service.js";

// Tool che usa la funzione di evocazione di un agente tematico come tool a disposizione di un agente
export class SubAgentTool extends Tool {

    constructor(nomeagente: string, systemprompt: string) {
        super();
        this.name = nomeagente;
        this.description = systemprompt;
    }

    name = "Mr Scagnozzo";
    description = "Sono il tool che avvia un agente associato al contesto richiesto, con una domanda pertinente, e altri metadati come il provider";
    protected async _call(arg: string | undefined): Promise<string> {
        if (!arg) throw new Error("Argomenti vuoti");
        const { context, provider, question, modelname } = JSON.parse(arg);

        //come posso inserire altri argomenti oltre alla question ? 
        let inputData = getDataRequestDFL();
        inputData.modelname = modelname;
        inputData.keyconversation = context + "_" + provider + modelname;

        const middleware = [handleToolErrors, createSummaryMemoryMiddleware(modelname) /*, dynamicSystemPrompt*/];

        //step 2. Recupero del systemprompt dalla logica esistente
        const systemPrompt = (context != ENDPOINT_CHATGENERICA) ? await getFrameworkPrompts(context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto
        console.log("System prompt : " + systemPrompt);

        const agent = getAgent(inputData, provider, systemPrompt, [], middleware, context);

        try {
            const result = invokeAgent(agent, question, inputData.keyconversation);
            return JSON.stringify(result);
        } catch {
            return `Errore durante l'esecuzione del sub agente ${agent.graph.getName()}`;
        }
    }
}