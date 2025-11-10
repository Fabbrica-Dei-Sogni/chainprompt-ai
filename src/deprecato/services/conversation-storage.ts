import fs from 'fs';
import dotenv from "dotenv";
import { DataRequest } from '../../core/interfaces/datarequest.js';
dotenv.config();

//XXX: questo approccio è una soluzione temporanea che verrà sostituita da una soluzione piu moderna e in linea con le logiche llm
const CONVERSATIONS: Record<string, any> = {};

const conversationFolder = process.env.PATH_CONVERSATION || 'src/datasets/conversations';

/**
 * @deprecated
 * @param noappendchat 
 * @param keyconversation 
 * @param conversation 
 */
async function commitConversation(noappendchat: boolean | undefined, keyconversation: string, conversation: string) {
    if (!noappendchat) {
        appendAnswerHistoryConversation(keyconversation, conversation);
    }
    //Fase applicativa di salvataggio della conversazione corrente su un file system.
    await writeObjectToFile(CONVERSATIONS, keyconversation);
}

/**
 * @deprecated
 * @param assistantResponse 
 * @param resultQuestionPrompt 
 * @param resultSystemPrompt 
 * @returns 
 */
function tailConversation(assistantResponse: string, resultQuestionPrompt: string, resultSystemPrompt: any) {
    const formattedAssistantResponse = `<| start_header_id |>assistant <| end_header_id |> ${assistantResponse}<| eot_id |>`;
    console.log(`Risposta assistente:\n`, formattedAssistantResponse);
    //Fase in cui si processa la risposta e in questo caso si accoda la risposta allo storico conversazione
    let conversation = `${resultQuestionPrompt}\n${formattedAssistantResponse}\n`;
    console.log(resultSystemPrompt + "\n" + conversation);
    return conversation;
}

/**
 * 
 * @deprecated
 * @param inputData 
 * @param systemPrompt 
 * @returns 
 */
function buildConversation(inputData: DataRequest, systemPrompt: string) {
    
    //XXX: vengono recuperati tutti i parametri provenienti dalla request, i parametri qui recuperati potrebbero aumentare nel tempo
    const { question, keyconversation, noappendchat }: DataRequest = inputData;//extractDataFromRequest(req, contextchat);

    //Fase di tracciamento dello storico di conversazione per uno specifico utente che ora e' identificato dal suo indirizzo ip
    // Crea una nuova conversazione per questo indirizzo IP
    //let resultSystemPrompt = `\n<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n ${systemPrompt}<|eot_id|>\n`;
    let formattedSystemPrompt = `\n<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n ${systemPrompt}<|eot_id|>\n`;
    let resultSystemPrompt = noappendchat ? formattedSystemPrompt
        : appendSystemPrompt(keyconversation, formattedSystemPrompt);

    let resultQuestionPrompt = `<|start_header_id|>user<|end_header_id|>\n${question}<|eot_id|>`;
    console.log(`System prompt contestuale:\n`, resultSystemPrompt);
    console.log(`Question prompt utente:\n`, resultQuestionPrompt);
    if (!noappendchat) {
        appendAnswerHistoryConversation(keyconversation, resultSystemPrompt);
    }
    
    return {
        resultSystemPrompt, resultQuestionPrompt
    }
}

function appendAnswerHistoryConversation(keyconversation: string, conversation: string) {

    CONVERSATIONS[keyconversation].conversationContext += conversation;

    return CONVERSATIONS[keyconversation].conversationContext;
}

function appendSystemPrompt(keyconversation: string, systemPrompt: string) {
    if (!CONVERSATIONS[keyconversation]) {
        CONVERSATIONS[keyconversation] = {
            startTime: new Date(),
            conversationContext: systemPrompt,
        };
    }
    return CONVERSATIONS[keyconversation].conversationContext;
}

/**
 Function to write an object to a text file
 * 
 * @param obj 
 * @param keyconversation 
 * @returns 
 */
export async function writeObjectToFile(obj: any, keyconversation = 'nondefinito'): Promise<string> {
    // Get current timestamp
    const timestamp = Date.now();

    // Ensure destination directory exists, otherwise create it
    const directoryPath = `${conversationFolder}`; // Change this path if needed
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
    }

    // Convert timestamp to a date/time string
    const filename = `${directoryPath}/${timestamp}_${keyconversation}_conversation.txt`;

    // Convert object to JSON string
    const jsonData = JSON.stringify(obj);
    const resultData = `\n\n//--- ${timestamp} ---\n${jsonData}`;

    // Write JSON to a text file
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, resultData, (err) => {
            if (err) {
                reject(err); // Reject promise with error if one occurs
                return;
            }

            resolve('Dictionary saved successfully to file.'); // Otherwise, resolve promise with filename
        });
    });
};