import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { LLMProvider } from "../models/llmprovider.enum.js";
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";
import { getInstanceLLM } from "../services/llm-chain.service.js";
import { DataRequest } from "../interfaces/datarequest.js";
import { CybersecurityAPITool } from "../tools/cybersecurityapi.tool.js";
import { createAgent, createMiddleware, dynamicSystemPromptMiddleware, ReactAgent, Tool, ToolMessage } from "langchain"; // Per agent react moderno in 1.0
import * as z from "zod";
import { ENDPOINT_CHATGENERICA, SYSTEMPROMPT_DFL } from "../services/common.services.js";
import { getFrameworkPrompts } from "../services/llm-request-handler.service.js";

//Questo codice è stato realizzato seguendo le linee guida di langchain 
//https://docs.langchain.com/oss/javascript/langchain/agents

// Definisci il prompt template (system + user + placeholder per tool output)
//XXX: verra definito nella cartella dei prompt
const systemPrompt = `Sei un esperto assistente di cybersecurity. Usa il tool "cybersecurity_api_tool" per interrogare dati API quando necessario.
Se devi analizzare vulnerabilità, specifica un JSON con "url" (endpoint API) e "params" (query params come oggetto).
Analizza i dati restituiti dal tool e fornisci risposte precise, basate su fatti, con rischi e mitigazioni.`;

//esempio per fornire uno schema all'agente
const contextSchema = z.object({
    userRole: z.enum(["expert", "beginner"]),
});

/**
 * Esempio di applicazione dinamica del system prompt
 */
const dynamicSystemPrompt = dynamicSystemPromptMiddleware<z.infer<typeof contextSchema>>((state, runtime) => {
    const userRole = runtime.context.userRole || "user";
    const basePrompt = systemPrompt;

    if (userRole === "expert") {
        return `${basePrompt} Provide detailed technical responses.`;
    } else if (userRole === "beginner") {
        return `${basePrompt} Explain concepts simply and avoid jargon.`;
    }
    return basePrompt;
})


/**
 * Gestione errore dei tool
 */
const handleToolErrors = createMiddleware({
    name: "HandleToolErrors",
    wrapToolCall: (request, handler) => {
        try {
            return handler(request);
        } catch (error) {
            // Return a custom error message to the model
            return new ToolMessage({
                content: `Tool error: Please check your input and try again. (${error})`,
                tool_call_id: request.toolCall.id!,
            });
        }
    },
});

/**
 * Crea un agente con specifiche caratteristiche dell'llm , il provider di accesso, il contesto tematico, eventuali tools
 * @param inputData 
 * @param provider 
 * @param context 
 * @param tools 
 * @returns 
 */
export async function getAgent(inputData: DataRequest, provider: LLMProvider, context: string, tools: Tool[]) {

    //Recupero del systemprompt dalla logica esistente
    const systemPrompt = (context != ENDPOINT_CHATGENERICA) ? await getFrameworkPrompts(context) : SYSTEMPROMPT_DFL; // Ottieni il prompt di sistema per il contesto

    const { temperature, modelname, maxTokens, numCtx }: DataRequest = inputData;

    let config: ConfigChainPrompt = {
        temperature: temperature, modelname, maxTokens, numCtx
    };

    const llm = getInstanceLLM(provider, config);

    tools = [new CybersecurityAPITool()];

    // 4. Crea l'agent con prompt custom
    const agent = createAgent({
        model: llm,
        tools,
        //contextSchema: contextSchema,
        middleware: [handleToolErrors/*, dynamicSystemPrompt*/] as const,
        systemPrompt: systemPrompt
    });

    return agent;
}

export async function invokeAgent(agent: ReactAgent, question: string) {

    const result = await agent.invoke(
        { messages: [{ role: "user", content: question }] },
        //{ context: { userRole: "expert" } }
    );

    return result;
}

