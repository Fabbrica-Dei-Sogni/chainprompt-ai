
// Implementazione delle rotte endpoint principali.
// In modo speculare, le stesse chiamate sono definite nel protocollo socket.io.
import express from "express";
const router = express.Router();
import { getAnswerLLM, getAnswerLocalLLM } from '../services/langchainservice.js';
import { ContextChat } from '../services/commonservices.js';
import { getFrameworkPrompts } from '../services/builderpromptservice.js';


router.post(`/localai/prompt/test`, async (req: any, res: any, next: any) => {
    try {
        const systemPrompt = await getFrameworkPrompts(ContextChat.CHAT_BOT_CV);

        const question = '\n' + req.body.question;
        const modelname = req.body.modelname;
        const temperature = req.body.temperature;
        let answer = await getAnswerLocalLLM(systemPrompt, question, temperature, modelname);
        res.json({ answer }); // Invia la risposta al client
    } catch (err) {
        console.error('Errore durante la conversazione:', err);
        res.status(500).json({ error: `Si è verificato un errore interno del server` });
    }
});

export default router;