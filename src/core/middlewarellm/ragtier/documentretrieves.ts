
/**
 * Questo componente invece rappresenta il modulo per interrogare i dati indicizzati tramite prompt seguendo le canoniche forme di sviluppo con langchain
 * 
 * https://python.langchain.com/docs/use_cases/question_answering/quickstart/
 * 
 * langchainhub langchain-openai langchain-chroma bs4

 */

import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { Ollama } from "@langchain/community/llms/ollama";
import { ConfigChainPrompt } from '../../interfaces/configchainprompt.js';
import { ChainPromptBaseTemplate } from '../../interfaces/chainpromptbasetemplate.js';
import { indexingAndStoreDocs } from "./documentsindexing.js";

/**
 * @deprecated
 * @param context @#@
 * @param config 
 * @param prompt 
 * @returns 
 */
export async function retrieveAndAskPrompt(context: string, config: ConfigChainPrompt, prompt: ChainPromptBaseTemplate) {

    //XXX: attualmente il flusso che recupera il vettore, lo ricrea sempre da zero tramite l'embedding api del modello scelto.
    //lo sviluppo futuro è il seguente:
    /*
    a) spostare l'intera logica di indicizzazione dei dati sul componente dedicato
    b) parametrizzare sia il nome del dato da indicizzare, sia il dato stesso:
       1. il dato puo essere preso da qualsiasi fonte (database, sito web, file di testo, o qualsiasi altro)
           a seconda il tipo di dato e di fonte esistono dei loader specifici. 
           Data la molteplicita di loader esistenti con le loro peculiari configurazioni,
           si è scelto di focalizzare gli studi utilizzando un loader di tipo testo e in prima battuta da un file di testo.
           Successivamente verranno declinati tutti i casi d'uso utili alla causa.
        2. Il dato in futuro potra essere letto anche da un parametro request ricevuto da un client applicativo che lo interroga (ad esempio un portfolio digitale)
        3. In base al tipo di dato si applica una tecnica di splitter, data la molteplicità di tecniche e splitter diversi,
           si focalizza lo studio utilizzando in prima battuta lo splitter RecursiveCharacterTextSplitter a meno di eccezioni strutturali.
        4. La indicizzazione avviene tramite varie tecniche, quella piu interessante risulta l'uso delle api embedding dei vari llm.
           Per comodità si focalizza lo studio usando l'embedding fornito da ollama, declinando in futuro le varie molteplicità anch'esse qui presenti.
        5. Capire come creare un vectordb avviato su docker che possa salvare i dati indicizzati al punto 4 attraverso un progetto docker dedicato (simile a quanto si puo fare con mongodb)
        6. se i precedenti punti sono stati eseguiti con successo, dovrà essere possibile da parte del layer della chatbot di comporre un prompt innestando in una variabile {context} il dato vettoriale indicizzato e ben identificato da una label , ad esempio il contesto (e in futuro l'utente) della chatbot tematica di riferimento.
        7. Attivati al punto sette, è possibile fattorizzare e progettare un'applicazione altamente customizzata sfruttando l'ecosistema langchain per interagire con una llm.
    */
    let retriever = await indexingAndStoreDocs(context, config.modelname!);

    const completePrompt = new PromptTemplate({
        template: "{systemprompt}\n\n{question}\n\n{context}",
        inputVariables: ["systemprompt", "question", "context"],
    });

    const llm = new Ollama({
        baseUrl: process.env.URI_LANGCHAIN_OLLAMA,
        temperature: config.temperature,
        model: config.modelname || process.env.LOCAL_MODEL_NAME,
        numCtx: config.numCtx,

        //XXX: parametri da capire e sperimentare
        keepAlive: "24h",
        logitsAll: true,
    });

    const ragChain = await createStuffDocumentsChain({
        llm: llm,
        prompt: completePrompt,
        outputParser: new StringOutputParser(),
    });

    const retrievedDocs = await retriever.getRelevantDocuments(
        prompt.systemprompt! + " " + prompt.question!
    );

    let answer = await ragChain.invoke({
        question: prompt.question,
        systemprompt: prompt.systemprompt,
        context: retrievedDocs,
    });



    return answer;
}

/*const declarativeRagChain = RunnableSequence.from([
    {
        context: retriever.pipe(formatDocumentsAsString),
        question: new RunnablePassthrough(),
    },
    prompt: completePrompt,
    llm : llm,
    new StringOutputParser(),
]);*/

