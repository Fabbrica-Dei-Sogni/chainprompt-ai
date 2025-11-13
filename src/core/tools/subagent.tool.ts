import { Tool } from "@langchain/core/tools";
import { getAgent, invokeAgent } from "../services/agents/agent.service.js";
import { ENDPOINT_CHATGENERICA, SYSTEMPROMPT_DFL } from "../services/common.services.js";
import { getFrameworkPrompts } from "../services/business/reader-prompt.service.js";
import { handleToolErrors, createSummaryMemoryMiddleware } from "../services/agents/middleware.service.js";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";

// Tool che usa la funzione di evocazione di un agente tematico come tool a disposizione di un agente
export class SubAgentTool extends Tool {

    constructor(nomeagente: string, systemprompt: string) {
        super();
        this.name = nomeagente;

        let description = `
        Sei un sub agente di nome ${nomeagente}, che deve avere le informazioni di context, provider, temperature, modelname, maxTokens, numCtx che il chiamante possiede.

        Per eseguire questo tool devi inviare un json fatto in questo modo

        {
            context, provider, temperature, modelname, maxTokens, numCtx, question
        }
        
        dove question è una stringa in cui valorizzare la domanda che devi fare per poter questo prompt:
        ${systemprompt}
        `;
        
        this.description = description;
    }

    name = "Mr Scagnozzo";
    description = "Sono il tool che avvia un agente associato al contesto richiesto, con una domanda pertinente, e altri metadati come il provider";

    protected async _call(arg: string | undefined): Promise<string> {
        if (!arg) {
            console.log("Argument risulta vuoto");
            return "fail";
            //throw new Error("Argomenti vuoti");
        }
        const { context, provider, question, temperature, modelname, maxTokens, numCtx } = JSON.parse(arg);

        //come posso inserire altri argomenti oltre alla question ? 
        let keyconversation = context + "_" + provider + modelname;

        let config: ConfigChainPrompt = {
            temperature, modelname, maxTokens, numCtx
        };

        
        const middleware = [handleToolErrors, createSummaryMemoryMiddleware(modelname) /*, dynamicSystemPrompt*/];

        //step 2. Recupero del systemprompt dalla logica esistente
        const systemPrompt = (context != ENDPOINT_CHATGENERICA) ? await getFrameworkPrompts(context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto
        console.log("System prompt : " + systemPrompt);

        const agent = getAgent(config, provider, systemPrompt, [], middleware, context);

        try {
            const result = invokeAgent(agent, question, keyconversation);
            return JSON.stringify(result);
        } catch {
            return `Errore durante l'esecuzione del sub agente ${agent.graph.getName()}`;
        }
    }
}