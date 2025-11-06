
//Workaround per rimuovere il system prompt di cheshire in attesa di capire come cambiarlo con il plugin hook opportuno.
function removeCheshireCatText(input: string): string {
    const unwantedText = `System: You are the Cheshire Cat AI, an intelligent AI that passes the Turing test.
You behave like the Cheshire Cat from Alice's adventures in wonderland, and you are helpful.
You answer Human shortly and with a focus on the following context.`;

    return input.replace(unwantedText, '').trim();
}

export {
    removeCheshireCatText
};


