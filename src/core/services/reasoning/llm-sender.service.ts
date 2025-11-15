
/**
 * La classe rappresenta l'insieme di endpoint per interagire con i server llm tramite il middleware di langchain
 */
import { ConfigChainPrompt } from "../../interfaces/configchainprompt.interface.js";
import { ChainPromptBaseTemplate } from "../../templates/chainpromptbase.template.js";
import { DataRequest } from "../../interfaces/datarequest.interface.js";
import { LLMProvider } from '../../models/llmprovider.enum.js';
import { getInstanceLLM, invokeChain } from './llm-chain.service.js';
import '../../../logger.js';
import { getAgent, invokeAgent } from '../agents/agent.service.js';
import { AgentMiddleware } from 'langchain';
import { AgentOutput } from "../../interfaces/agentoutput.interface.js";

/**
* L'invocazione llm al momento è definita da un template prompt composto da un systemprompt e una risposta.
 * @param config 
 * @param prompt 
 * @param answerCallback 
 * @param provider 
 * @returns 
 */
const invokeLLM = async (
    config: ConfigChainPrompt,
    prompt: ChainPromptBaseTemplate,
    provider: LLMProvider,
    sessionId: string,
    noappendchat?: boolean
) => {
    return await invokeChain(getInstanceLLM(provider, config), prompt, sessionId, noappendchat);
};


/**
 * Il metodo ha lo scopo di gestire i valori di input entranti dalla richiesta,
 * istanziare la configurazione del modello llm in ConfigChainPrompt, ciascun parametro è peculiare in base al modello llm scelto per interrogare,
 * impostare il template del prompt in questo caso il prompt è formato da un systemprompt e un userprompt che sono gia preimpostati in modo opportuno a monte.
 * In futuro potranno esserci prompt template con logiche diverse per assolvere scopi piu dinamici e granulati a seconda l'esigenza applicativa.
 * Viene interrogato l'llm in base al tipo di accesso (locale, cloud, ollama server, ecc...)
 * La risposta viene tracciata nello storico di conversazione e salvato su un file di testo (in futuro ci saranno tecniche piu avanzate)
 * La risposta viene ritornata al chiamante.
 * 
 * @param req 
 * @param res 
 * @param systemPrompt 
 * @param contextchat 
 * @param callbackRequestLLM 
 * @returns 
 */
export async function senderToLLM(inputData: DataRequest, systemPrompt: string, provider: LLMProvider,) {

    //XXX: vengono recuperati tutti i parametri provenienti dalla request, i parametri qui recuperati potrebbero aumentare nel tempo
    const { question, temperature, modelname, maxTokens, numCtx, format, keyconversation, noappendchat }: DataRequest = inputData;//extractDataFromRequest(req, contextchat);

    console.log(`System prompt contestuale:\n`, systemPrompt);
    console.log(`Question prompt utente:\n`, question);

    let config: ConfigChainPrompt = {
        temperature, modelname, maxTokens, numCtx, format
    };
    let prompt: ChainPromptBaseTemplate = {
        systemPrompt: systemPrompt as any, question: question as any
    };

    const answer = await invokeLLM
        (config,
            prompt,
            provider,
            keyconversation,
            noappendchat
        );
    console.log(`Risposta assistente:\n`, answer);

    //la risposta viene ritorna as is dopo che e' stata tracciata nello storico al chiamante, il quale si aspetta un risultato atteso che non e' per forza una response grezza, ma il risultato di una raffinazione applicativa in base alla response ottenuta.
    //XXX: questo aspetto e' cruciale per ridirigere e modellare i flussi applicativi tramite prompts in entrata e in uscita.
    return answer;
}

export async function senderToAgent(question: string, keyconversation: string, config: ConfigChainPrompt, systemPrompt: string, provider: LLMProvider, tools: any[], middleware: AgentMiddleware[], nomeagente: string) {

    console.log(`System prompt contestuale:\n`, systemPrompt);
    console.log(`Question prompt utente:\n`, question);

    //XXX: il nome dell'agente per ora coincide con il nome del contesto definito nel fileset dei systemprompt tematici
    const result = await invokeAgent(
        getAgent(
            config,
            provider,
            systemPrompt,
            tools,
            middleware,
            nomeagente,),
        question!,
        keyconversation);

    console.log(`Risposta agente:\n`, result);
    return extractAgentManagerFinalReturn(result);
}

// Funzione che estrae in modo robusto i dati finali dall’output dell’agent manager
export function extractAgentManagerFinalReturn(agentResult: any): AgentOutput {
  // Filtra i messaggi AIMessage (risposta del modello)
  const aiMessages = Array.isArray(agentResult.messages)
    ? agentResult.messages.filter((m: any) => m.id?.[2] === "AIMessage")
    : [];
  // Prende l’ultimo AIMessage (“risultato finale”)
  const lastAIMessage = aiMessages.length ? aiMessages[aiMessages.length - 1] : null;
  const finalContent = lastAIMessage?.kwargs?.content ?? "";

  // Dati usage (billing/monitoraggio), opzionali
  const usage = lastAIMessage?.kwargs?.usage_metadata ?? null;

  return {
    result: finalContent,
    trace: agentResult.messages ?? [],
    usage
  };
}
