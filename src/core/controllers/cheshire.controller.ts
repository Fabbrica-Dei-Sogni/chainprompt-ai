
import { handlePrompt } from './handlers.controller.js'

//Workaround per rimuovere il system prompt di cheshire in attesa di capire come cambiarlo con il plugin hook opportuno.
function removeCheshireCatText(input: string): string {
    const unwantedText = `System: You are the Cheshire Cat AI, an intelligent AI that passes the Turing test.
You behave like the Cheshire Cat from Alice's adventures in wonderland, and you are helpful.
You answer Human shortly and with a focus on the following context.`;

    return input.replace(unwantedText, '').trim();
}

async function submitAgentAction(req: any, getSendPromptCallback: any) {
        const originalUriTokens = req.originalUrl.split('/');
        const contextchat = originalUriTokens[originalUriTokens.length - 1];

        //migliorare il passaggio di parametri
        req.body.noappendchat = true;

        req.body.text = removeCheshireCatText(req.body.text);
        let answer = await handlePrompt(req, contextchat, getSendPromptCallback);
        return answer;
    }

export {
    submitAgentAction
};


