
// Implementazione delle rotte endpoint principali.
// In modo speculare, le stesse chiamate sono definite nel protocollo socket.io.
import express from "express";
const router = express.Router();
import { getAnswerLLM, getAnswerLocalLLM, getAnswerOllamaLLM } from '../services/langchainservice.js';
import { writeObjectToFile, contextFolder, ContextChat } from '../services/commonservices.js';
import { getFrameworkPrompts } from '../services/builderpromptservice.js';
import * as requestIp from 'request-ip';
import fs from 'fs';

const conversations: Record<string, any> = {};
const contexts = fs.readdirSync(contextFolder);

// Funzione per gestire la richiesta del prompt per un determinato contesto
const handleLocalRequest = async (req: any, res: any, next: any) => {
    try {
        const originalUriTokens = req.originalUrl.split('/');
        const context = originalUriTokens[originalUriTokens.length - 1];
        const systemPrompt = await getFrameworkPrompts(context); // Ottieni il prompt di sistema per il contesto
        let answer = await getAndSendPromptLocalLLM(req, res, systemPrompt, context); // Invia il prompt al client
        res.json({ answer }); // Invia la risposta al client
    } catch (err) {
        console.error('Errore durante la conversazione:', err);
        res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
};

const handleCloudLLMRequest = async (req: any, res: any, next: any) => {
    try {
        const originalUriTokens = req.originalUrl.split('/');
        const context = originalUriTokens[originalUriTokens.length - 1];
        const systemPrompt = await getFrameworkPrompts(context); // Ottieni il prompt di sistema per il contesto
        let answer = await getAndSendPromptCloudLLM(req, res, systemPrompt, context); // Invia il prompt al client
        res.json({ answer }); // Invia la risposta al client
    } catch (err) {
        console.error('Errore durante la conversazione:', err);
        res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
};

const handleLocalOllamaRequest = async (req: any, res: any, next: any) => {
    try {
        const originalUriTokens = req.originalUrl.split('/');
        const context = originalUriTokens[originalUriTokens.length - 1];
        const systemPrompt = await getFrameworkPrompts(context); // Ottieni il prompt di sistema per il contesto
        let answer = await getAndSendPromptbyOllamaLLM(req, res, systemPrompt, context); // Invia il prompt al client
        res.json({ answer }); // Invia la risposta al client
    } catch (err) {
        console.error('Errore durante la conversazione:', err);
        res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
};



async function getAndSendPromptCloudLLM(req: any, res: any, systemPrompt: string, contextchat: string) {
    return await callBackgetAndSendPromptbyLocalRest(req, res, systemPrompt, contextchat, getAnswerLLM);
}

async function getAndSendPromptLocalLLM(req: any, res: any, systemPrompt: string, contextchat: string) {
    return await callBackgetAndSendPromptbyLocalRest(req, res, systemPrompt, contextchat, getAnswerLocalLLM);
}

async function getAndSendPromptbyOllamaLLM(req: any, res: any, systemPrompt: string, contextchat: string) {
    return await callBackgetAndSendPromptbyLocalRest(req, res, systemPrompt, contextchat, getAnswerOllamaLLM);
}

async function callBackgetAndSendPromptbyLocalRest(req: any, res: any, systemPrompt: string, contextchat: string, callbackRequestLLM: any) {
    const { systemprompt, question, temperature, modelname, keyconversation } = buildAndTrackPromptRest(req, systemPrompt, contextchat);
    const assistantResponse = await callbackRequestLLM(systemprompt, question, temperature || 0.1, modelname);
    conversations[keyconversation].conversationContext += `\nAI: ${assistantResponse}\n`;
    await writeObjectToFile(conversations, contextchat);

    return assistantResponse;
}

function buildAndTrackPromptRest(req: any, systemPrompt: string, context: string) {
    console.log("Estrazione informazioni data input per la preparazione al prompt di sistema....");

    const question = '\n' + req.body.question;
    const modelname = req.body.modelname;
    const temperature = req.body.temperature;
    const ipAddress = requestIp.getClientIp(req);
    const keyconversation = ipAddress + "_" + context;

    // Crea una nuova conversazione per questo indirizzo IP
    if (!conversations[keyconversation]) {
        conversations[keyconversation] = {
            startTime: new Date(),
            conversationContext: systemPrompt,
        };
    }
    conversations[keyconversation].conversationContext += `\nHuman: ${question}\n`;
    console.log("Indirizzo ip: ", ipAddress);
    console.log("Domanda ricevuta:", question);
    const systemprompt = conversations[keyconversation].conversationContext;

    return { systemprompt, question, temperature, modelname, keyconversation };
}

// Genera le route dinamicamente per ogni contesto disponibile
contexts.forEach(context => {
    router.post(`/langchain/localai/prompt/${context}`, handleLocalRequest);
});

// Genera le route dinamicamente per ogni contesto disponibile
contexts.forEach(context => {
    router.post(`/langchain/cloud/prompt/${context}`, handleCloudLLMRequest);
});

contexts.forEach(context => {
    router.post(`/langchain/ollama/prompt/${context}`, handleLocalOllamaRequest);
});

export default router;