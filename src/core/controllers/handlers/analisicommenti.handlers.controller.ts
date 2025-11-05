
import { submitAgentAction } from "../agents/analisicommenti.controller.js";
import { getAndSendPromptCloudLLM, getAndSendPromptLocalLLM, getAndSendPromptbyOllamaLLM, } from '../commons/businesscontroller.js'


const handleLocalRequest = async (req: any, res: any, next: any) => {
    await handleRequest(req, res, next, getAndSendPromptLocalLLM);
};

const handleCloudLLMRequest = async (req: any, res: any, next: any) => {
    await handleRequest(req, res, next, getAndSendPromptCloudLLM);
};

const handleLocalOllamaRequest = async (req: any, res: any, next: any) => {
    await handleRequest(req, res, next, getAndSendPromptbyOllamaLLM);
};

async function handleRequest(req: any, res: any, next: any, sendPromptLLMCallback: any) {

    //Parametri di input, l'uri del video you tube e l'id del commento da cui iniziare. Se non c'e l'id viene analizzato l'intera lista dei commenti principali.
    const { payload } = req.body;

    //si definiscono i default sul maxtoken e numCtx per il analisicommenti
    req.body.numCtx = !req.body.numCtx ? 2040 : req.body.numCtx;
    req.body.maxToken = !req.body.maxToken ? null : req.body.maxToken;
    req.body.noappendchat = true;

    // Verifica se l'URL è stato fornito
    if (!payload) {
        return res.status(400).json({ error: 'Payload commenti mancante' });
    }

    try {
        // Rispondi con il risultato dello scraping
        // Chiama lo scraper per l'URL fornito
        //const decodeComments = safeBase64Decode(payload);
        let answer = await submitAgentAction(payload, req, sendPromptLLMCallback);

        // Rispondi con il risultato dello scraping
        res.json(answer);
    } catch (error) {
        res.status(500).json({ error: 'Errore durante l\'analisi dei commenti' });
    }
}

export {
    handleCloudLLMRequest,handleLocalOllamaRequest, handleLocalRequest
};