/**
 * 
 * Questo componente rappresenta la pipeline per caricare documenti grezzi che siano testo o altro formato, in generale dati non strutturati e indicizzarli tramite tecnihe di splitting e vettorializzazione dei dati per essere piu facilmente "digeriti".
 * Tali dati sono poi salvati in un database come Chroma.
 * Rappresenta il componente che popola, aggiorna, cancella dati indicizzati a partire da dati grezzi.
 * 
 * https://python.langchain.com/docs/use_cases/question_answering/quickstart/
 * 
 */
import { contextFolder } from '../../../core/services/common.services.js';
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RecursiveCharacterTextSplitter, } from 'langchain/text_splitter';

/**
 * @deprecated
 * @param context
 * @param modelname 
 * @returns 
 */
export async function indexingAndStoreDocs(context: string, modelname: string) {
    const loader = new TextLoader(`${contextFolder}/${context}/prompt.contesto`);
    const docs = await loader.load();
    // Creazione di un nuovo splitter per dividere il testo in documenti
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 100,
        chunkOverlap: 20,
    });
    const splits = await textSplitter.splitDocuments(docs);
    const vectorStore = await MemoryVectorStore.fromDocuments(
        splits,
        new OllamaEmbeddings({
            baseUrl: process.env.URI_LANGCHAIN_OLLAMA,
            model: modelname || process.env.LOCAL_MODEL_NAME,
        })
    );
    const retriever = vectorStore.asRetriever();

    return retriever;
}