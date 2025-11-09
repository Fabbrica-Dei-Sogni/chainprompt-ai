
/**
 * La classe rappresenta l'insieme di endpoint per interagire con i server llm tramite il middleware di langchain
 */
import { buildConversation, commitConversation, tailConversation } from './conversation-storage.js';
import { ConfigChainPrompt } from "../interfaces/configchainprompt.js";
import { ChainPromptBaseTemplate } from "../interfaces/chainpromptbasetemplate.js";
import { DataRequest } from "../interfaces/datarequest.js";
import { LLMProvider } from '../models/llmprovider.enum.js';
import { getInstanceLLM, invokeChain } from './llm-chain.service.js';
import '../../logger.js';

/**
* L'invocazione llm al momento è definita da un template prompt composto da un systemprompt e una risposta.
 * @param config 
 * @param prompt 
 * @param answerCallback 
 * @param provider 
 * @returns 
 */
const executeByProvider = async (
    config: ConfigChainPrompt,
    prompt: ChainPromptBaseTemplate,
    provider: LLMProvider

) => {
    return await invokeChain(getInstanceLLM(provider, config), prompt);
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
    const { question, temperature, modelname, maxTokens, numCtx, keyconversation, noappendchat }: DataRequest = inputData;//extractDataFromRequest(req, contextchat);

    //Fase di tracciamento dello storico di conversazione per uno specifico utente che ora e' identificato dal suo indirizzo ip
    // Crea una nuova conversazione per questo indirizzo IP
    const { resultQuestionPrompt, resultSystemPrompt } = buildConversation(inputData, systemPrompt);

    let config: ConfigChainPrompt = {
        temperature: temperature, modelname, maxTokens, numCtx
    };
    let prompt: ChainPromptBaseTemplate = {
        systemprompt: resultSystemPrompt, question: question as any
    };

    const assistantResponse = await executeByProvider
        (config,
            prompt,
            provider);


    let conversation = tailConversation(assistantResponse, resultQuestionPrompt, resultSystemPrompt);

    await commitConversation(noappendchat, keyconversation, conversation);

    //Fase applicative che o reiterano le fasi precedenti.

    //XXX: ciascuna fase dopo il recupero della risposta è a discrezione delle scelte progettuali applicative in cui scegliere lo strumento migliore per manipolare la risposta.
    //Questi aspetti saranno cruciali e potrebbero evolversi in componenti che potrebbero essere di dominio ad altre componenti.

    //la risposta viene ritorna as is dopo che e' stata tracciata nello storico al chiamante, il quale si aspetta un risultato atteso che non e' per forza una response grezza, ma il risultato di una raffinazione applicativa in base alla response ottenuta.
    //XXX: questo aspetto e' cruciale per ridirigere e modellare i flussi applicativi tramite prompts in entrata e in uscita.
    return assistantResponse;
}
