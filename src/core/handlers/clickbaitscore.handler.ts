import { handlePrompt } from '../controllers/handlers.controller.js'
import { getAndSendPromptCloudLLM, getAndSendPromptLocalLLM, getAndSendPromptbyOllamaLLM, } from '../controllers/business.controller.js'
import { scrapeArticle,decodeBase64 } from "../controllers/clickbaitscore.controller.js";

async function submitAgentAction(url: any, req: any, sendPromptLLMCallback: any) {
    const decodedUri = decodeBase64(url);

    const { title, content } = await scrapeArticle(decodedUri);
    req.body.question = `<TITOLO>${title}</TITOLO>\n<ARTICOLO>${content}</ARTICOLO>\n`;
    //si definiscono i default sul maxtoken e numCtx per il clickbaitscore
    req.body.numCtx = !req.body.numCtx ? 2040 : req.body.numCtx;
    req.body.maxToken = !req.body.maxToken ? 8032 : req.body.maxToken;
    req.body.noappendchat = true;

    let answer = await handlePrompt(req, 'clickbaitscore', sendPromptLLMCallback);
    return answer;
}

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

    const { url } = req.body;
    // Verifica se l'URL è stato fornito
    if (!url) {
        return res.status(400).json({ error: 'URL mancante' });
    }

    try {
        // Rispondi con il risultato dello scraping
        // Chiama lo scraper per l'URL fornito
        let answer = await submitAgentAction(url, req, sendPromptLLMCallback);

        // Rispondi con il risultato dello scraping
        res.json(answer);
    } catch (error) {
        res.status(500).json({ error: 'Errore durante lo scraping' });
    }
}

export {
    handleLocalRequest, handleCloudLLMRequest, handleLocalOllamaRequest
};