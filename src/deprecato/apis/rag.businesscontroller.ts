
/**
 * La classe rappresenta l'insieme di endpoint per interagire con i server llm tramite il middleware di langchain
 */
import { getAnswerRAGOllamaLLM, } from '../../deprecato/middlewarellm/systemuserbasicprompt.js';
import { writeObjectToFile } from '../../core/services/commonservices.js';
import { ConfigChainPrompt } from "../../core/interfaces/configchainprompt.js";
import { ChainPromptBaseTemplate } from "../../core/interfaces/chainpromptbasetemplate.js";
import { DataRequest } from "../../core/interfaces/datarequest.js";

const conversations: Record<string, any> = {};

async function getAndSendPromptbyRAGOllamaLLM(inputData: DataRequest, systemPrompt: string, contextchat: string) {
    return await callBackgetAndSendPromptbyRAGLocalRest(inputData, systemPrompt, contextchat, getAnswerRAGOllamaLLM);
}

async function callBackgetAndSendPromptbyRAGLocalRest(inputData: DataRequest, systemPrompt: string, contextchat: string, callbackRequestLLM: any) {

    //XXX: vengono recuperati tutti i parametri provenienti dalla request, i parametri qui recuperati potrebbero aumentare nel tempo
    const { question, temperature, modelname, maxTokens, numCtx, keyconversation }: DataRequest = inputData;//extractDataFromRequest(req, contextchat);

    //Fase di tracciamento dello storico di conversazione per uno specifico utente che ora e' identificato dal suo indirizzo ip
    // Crea una nuova conversazione per questo indirizzo IP
    const systemprompt = setQuestionHistoryConversation(keyconversation, systemPrompt, question);

    //Fase di composizione della configurazione del contesto chainprompt con i parametri necessari a processare il prompt
    const assistantResponse = await invokeRAGLLM(contextchat, temperature, modelname, maxTokens, numCtx, systemprompt, question, callbackRequestLLM);

    //Fase in cui si processa la risposta e in questo caso si accoda la risposta allo storico conversazione
    setAnswerHistoryConversation(keyconversation, assistantResponse, question);

    //Fase applicativa di salvataggio della conversazione corrente su un file system.
    await writeObjectToFile(conversations, keyconversation);

    //Fase applicative che o reiterano le fasi precedenti.

    //XXX: ciascuna fase dopo il recupero della risposta è a discrezione delle scelte progettuali applicative in cui scegliere lo strumento migliore per manipolare la risposta.
    //Questi aspetti saranno cruciali e potrebbero evolversi in componenti che potrebbero essere di dominio ad altre componenti.

    //la risposta viene ritorna as is dopo che e' stata tracciata nello storico al chiamante, il quale si aspetta un risultato atteso che non e' per forza una response grezza, ma il risultato di una raffinazione applicativa in base alla response ottenuta.
    //XXX: questo aspetto e' cruciale per ridirigere e modellare i flussi applicativi tramite prompts in entrata e in uscita.
    return assistantResponse;
}

async function invokeRAGLLM(context: string, temperature: number | undefined, modelname: string | undefined, maxTokens: number | undefined, numCtx: number | undefined, systemprompt: any, question: string | undefined, callbackRequestLLM: any) {
    let config: ConfigChainPrompt = {
        temperature: temperature, modelname, maxTokens, numCtx
    };
    let prompt: ChainPromptBaseTemplate = {
        systemprompt, question
    };
    //Fase in cui avviene la chiamata al modello llm tramite invoke langchain
    const assistantResponse = await callbackRequestLLM(context, config, prompt);
    return assistantResponse;
}


function setAnswerHistoryConversation(keyconversation: string, assistantResponse: any, question: any) {
    conversations[keyconversation].conversationContext += `<|user|>\n${question}<|end|>\n<|assistant|>${assistantResponse}<|end|>\n`;
}

function setQuestionHistoryConversation(keyconversation: string, systemPrompt: string, question: string | undefined) {
    if (!conversations[keyconversation]) {
        conversations[keyconversation] = {
            startTime: new Date(),
            conversationContext: `\n<|system|>\n ${systemPrompt}<|end|>\n`,
        };
    }
    //conversations[keyconversation].conversationContext += `\n\n<|user|>\n${question}<|end|>\n`;
    const systemprompt = conversations[keyconversation].conversationContext;
    return systemprompt;
}


export {
    getAndSendPromptbyRAGOllamaLLM,
};