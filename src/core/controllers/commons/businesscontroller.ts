
/**
 * La classe rappresenta l'insieme di endpoint per interagire con i server llm tramite il middleware di langchain
 */
import { getAnswerLLM, getAnswerLocalLLM, getAnswerOllamaLLM  } from '../../services/langchainservice.js';
import { writeObjectToFile } from '../../services/commonservices.js';
import { ConfigChainPrompt } from "../../interfaces/configchainprompt.js";
import { ChainPromptBaseTemplate } from "../../interfaces/chainpromptbasetemplate.js";
import { DataRequest } from "../../interfaces/datarequest.js";

const conversations: Record<string, any> = {};

async function getAndSendPromptCloudLLM(inputData: DataRequest, systemPrompt: string, contextchat: string) {
    //il contextchat è il tema del system prompt.
    //per ora non viene usato a questo livello, ma puo essere utile in futuro.
    return await callbackSendPromptToLLM(inputData, systemPrompt, /*contextchat,*/ getAnswerLLM);
}

async function getAndSendPromptLocalLLM(inputData: DataRequest, systemPrompt: string, contextchat: string) {
    return await callbackSendPromptToLLM(inputData, systemPrompt, /*contextchat,*/ getAnswerLocalLLM);
}

async function getAndSendPromptbyOllamaLLM(inputData: DataRequest, systemPrompt: string, contextchat: string) {
    return await callbackSendPromptToLLM(inputData, systemPrompt, /*contextchat,*/ getAnswerOllamaLLM);
}

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
async function callbackSendPromptToLLM(inputData: DataRequest, systemPrompt: string, callbackRequestLLM: any) {

    //XXX: vengono recuperati tutti i parametri provenienti dalla request, i parametri qui recuperati potrebbero aumentare nel tempo
    const { question, temperature, modelname, maxTokens, numCtx, keyconversation }: DataRequest = inputData;//extractDataFromRequest(req, contextchat);

    //Fase di tracciamento dello storico di conversazione per uno specifico utente che ora e' identificato dal suo indirizzo ip
    // Crea una nuova conversazione per questo indirizzo IP
    //let resultSystemPrompt = `\n<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n ${systemPrompt}<|eot_id|>\n`;
    systemPrompt = `\n<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n ${systemPrompt}<|eot_id|>\n`;
    let resultSystemPrompt = inputData.noappendchat ? systemPrompt
        : appendSystemPrompt(keyconversation, systemPrompt);

    let resultQuestionPrompt = `<|start_header_id|>user<|end_header_id|>\n${question}<|eot_id|>`;
    console.log(`System prompt contestuale:\n`, resultSystemPrompt);
    console.log(`Question prompt utente:\n`, resultQuestionPrompt);
    if (!inputData.noappendchat) {
        appendAnswerHistoryConversation(keyconversation, resultSystemPrompt);
    }

    const assistantResponse = await invokeLLM
        (
            temperature,
            modelname,
            maxTokens,
            numCtx,
            resultSystemPrompt,
            question,
            callbackRequestLLM);
    const resultAssistantResponse = `<| start_header_id |>assistant <| end_header_id |> ${assistantResponse}<| eot_id |>`;
    console.log(`Risposta assistente:\n`, resultAssistantResponse);

    //Fase in cui si processa la risposta e in questo caso si accoda la risposta allo storico conversazione
    let conversation = `${resultQuestionPrompt}\n${resultAssistantResponse}\n`;
    console.log(resultSystemPrompt + "\n" + conversation);
    if (!inputData.noappendchat) {
        appendAnswerHistoryConversation(keyconversation, conversation);
    }


    //Fase applicativa di salvataggio della conversazione corrente su un file system.
    await writeObjectToFile(conversations, keyconversation);

    //Fase applicative che o reiterano le fasi precedenti.

    //XXX: ciascuna fase dopo il recupero della risposta è a discrezione delle scelte progettuali applicative in cui scegliere lo strumento migliore per manipolare la risposta.
    //Questi aspetti saranno cruciali e potrebbero evolversi in componenti che potrebbero essere di dominio ad altre componenti.

    //la risposta viene ritorna as is dopo che e' stata tracciata nello storico al chiamante, il quale si aspetta un risultato atteso che non e' per forza una response grezza, ma il risultato di una raffinazione applicativa in base alla response ottenuta.
    //XXX: questo aspetto e' cruciale per ridirigere e modellare i flussi applicativi tramite prompts in entrata e in uscita.
    return assistantResponse;
}

async function invokeLLM(temperature: number | undefined, modelname: string | undefined, maxTokens: number | undefined, numCtx: number | undefined, systemprompt: any, question: string | undefined, callbackRequestLLM: any) {
    let config: ConfigChainPrompt = {
        temperature: temperature, modelname, maxTokens, numCtx
    };
    let prompt: ChainPromptBaseTemplate = {
        systemprompt, question
    };
    //Fase in cui avviene la chiamata al modello llm tramite invoke langchain
    const assistantResponse = await callbackRequestLLM(config, prompt);
    return assistantResponse;
}

function appendAnswerHistoryConversation(keyconversation: string, conversation: string) {

    conversations[keyconversation].conversationContext += conversation;
    return conversations[keyconversation].conversationContext;
}

function appendSystemPrompt(keyconversation: string, systemPrompt: string) {
    if (!conversations[keyconversation]) {
        conversations[keyconversation] = {
            startTime: new Date(),
            conversationContext: systemPrompt,
        };
    }
    const systemprompt = conversations[keyconversation].conversationContext;
    return systemprompt;
}


export {
    getAndSendPromptCloudLLM, getAndSendPromptLocalLLM, getAndSendPromptbyOllamaLLM,
};