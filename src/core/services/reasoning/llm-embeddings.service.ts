import { OpenAIEmbeddings } from "@langchain/openai";
import { CacheBackedEmbeddings } from "@langchain/classic/embeddings/cache_backed";
import { AzureOpenAIEmbeddings } from "@langchain/openai"; // Per Azure
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { VertexAIEmbeddings } from "@langchain/google-vertexai"; // Per Google
import { Embeddings } from "@langchain/core/embeddings"; // Base class
import { InMemoryStore } from "@langchain/core/stores"; // O RedisStore per il tuo setup
import '../../../logger.js'; // Il tuo logger
import { OllamaEmbeddings, } from "@langchain/ollama";
import { ConfigEmbeddings } from "../../interfaces/configembeddings.interface.js";
import { EmbeddingProvider } from "../../models/embeddingprovider.enum.js";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { Pool } from "pg";
import { getVectorStoreSingleton, POSTGRESQL_CLIENT_INSTANCE } from "../memory/postgresql/postgresql.service.js";
import { getConfigEmbeddingsDFL } from "../../models/converter.models.js";
import { getSectionsPrompts } from "../business/reader-prompt.service.js";


/**
 * Ritorna l'istanza di un embedding model in base al provider scelto.
 * 
 * @param provider - EmbeddingProvider enum
 * @param config - Configurazione specifica
 * @returns Embeddings instance
 */
export function getInstanceEmbeddings(provider: EmbeddingProvider, config: ConfigEmbeddings) {
  let instance: Embeddings;

  switch (provider) {
    case EmbeddingProvider.OpenAI:
      instance = getOpenAIEmbeddings(config);
      break;
    case EmbeddingProvider.AzureOpenAI:
      instance = getAzureOpenAIEmbeddings(config);
      break;
    case EmbeddingProvider.Ollama:
      instance = getOllamaEmbeddings(config);
      break;
    case EmbeddingProvider.HuggingFace:
      instance = getHuggingFaceEmbeddings(config);
      break;
    case EmbeddingProvider.HuggingFaceLocal:
      instance = getHuggingFaceLocalEmbeddings(config);
      break;
    case EmbeddingProvider.GoogleVertexAI:
      instance = getGoogleVertexAIEmbeddings(config);
      break;
    default:
      throw new Error(`Provider embedding non supportato: ${provider}`);
  }

  // Opzionale: Aggiungi caching con InMemoryStore (o Redis per multi-sessione)
  const store = new InMemoryStore(); // Sostituisci con RedisStore se usi Redis come per LLM
  const cachedInstance = CacheBackedEmbeddings.fromBytesStore(
    instance,
    store,
    { namespace: config.modelname } // Namespace per caching per-model
  );

  return cachedInstance; // O instance se non usi caching
};

  // Implementazioni per ciascun provider (simili a getInstanceLLM)

const getOpenAIEmbeddings = (config: ConfigEmbeddings) => {
  const embeddings = new OpenAIEmbeddings({
    model: config.modelname, // Es. 'text-embedding-3-small'
    apiKey: process.env.OPENAI_API_KEY,
    dimensions: config.dimension || 1536, // Dimensione vettoriale
    timeout: config.timeout || 30000,
  });
  return embeddings;
};

const getAzureOpenAIEmbeddings = (config: ConfigEmbeddings) => {
  const embeddings = new AzureOpenAIEmbeddings({
    model: config.modelname,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    dimensions: config.dimension || 1536,
    timeout: config.timeout || 30000,
  });
  return embeddings;
};

const getOllamaEmbeddings = (config: ConfigEmbeddings) => {
  const embeddings = new OllamaEmbeddings({
    model: config.modelname || 'mxbai-embed-large', // Es. 'nomic-embed-text'
    baseUrl: config.baseUrl || process.env.URI_LANGCHAIN_OLLAMA,
    //requestTimeout: config.timeout || 30000,
    // Aggiungi parametri specifici come numCtx se necessario
  });
  return embeddings;
};

const getHuggingFaceEmbeddings = (config: ConfigEmbeddings) => {
  const embeddings = new HuggingFaceInferenceEmbeddings({
    model: config.modelname, // Es. 'sentence-transformers/all-MiniLM-L6-v2'
    apiKey: process.env.HUGGINGFACEHUB_API_TOKEN,
  });
  return embeddings;
};

const getHuggingFaceLocalEmbeddings = (config: ConfigEmbeddings) => {
  const embeddings = new HuggingFaceTransformersEmbeddings({
    model: config.modelname,
    // Non richiede API key, modelli locali scaricati
  });
  return embeddings;
};

const getGoogleVertexAIEmbeddings = (config: ConfigEmbeddings) => {
  const embeddings = new VertexAIEmbeddings({
    model: config.modelname, // Es. 'textembedding-gecko'
    //project: process.env.GOOGLE_PROJECT_ID,
    location: process.env.GOOGLE_LOCATION || 'us-central1',
    dimensions: config.dimension || 768,
  });
  return embeddings;
};

export async function syncToolAgentEmbeddings(contexts: string[], provider: EmbeddingProvider = EmbeddingProvider.Ollama) {
    //XXX: inserimento di tutti gli agenti tematici idonei
    let docs: {
        pageContent: string;
        metadata: any;
    }[] = [];

    for (const context of contexts) {
        const subContext = context;
        //XXX: composizione custom di una descrizione di un tool agent estrapolando ruolo e azione dal systemprompt.
        let prRuolo = await getSectionsPrompts(subContext, "prompt.ruolo");
        let prAzione = await getSectionsPrompts(subContext, "prompt.azione");
        const descriptionSubAgent = prRuolo + "\n" + prAzione; //await getFrameworkPrompts(subContext);

        //console.log("System prompt subcontext: " + promptsubAgent);
        docs.push({ pageContent: prRuolo, metadata: null });
    }
    syncDocsPgvectorStore(provider, getConfigEmbeddingsDFL(), docs);
}

/**
 * Sincronizza i documenti tools: aggiunge nuovi, aggiorna changed,
 * cancella obsoleti se necessario.
 * @param toolDocs - array di documenti/tools correnti
 */
// Sincronizzazione base (con SQL)
async function syncDocsPgvectorStore(
  provider: EmbeddingProvider,
  config: ConfigEmbeddings,
  toolDocs: { pageContent: string, metadata: any }[]
): Promise<{ added: number; updated: number; deleted: number }> {
  let pool: Pool | undefined;
  let vectorStore: PGVectorStore | undefined;

  let added = 0, updated = 0, deleted = 0;
  try {
    pool = POSTGRESQL_CLIENT_INSTANCE.getOrCreatePool();
    vectorStore = await getVectorStoreSingleton(provider, config);

    // Recupero dei documenti esistenti
    const existingDocs = await getExistingToolDocs(pool, "tool_embeddings");
    const existingNames = new Set(existingDocs.map(d => d.metadata?.name));
    const newNames = new Set(toolDocs.map(d => d.metadata?.name));

    // Identificazione batch
    const docsToAdd = toolDocs.filter(d => !existingNames.has(d.metadata?.name));
    const docsToUpdate = toolDocs.filter(doc => {
      const old = existingDocs.find(d => d.metadata?.name === doc.metadata?.name);
      return old && old.description !== doc.pageContent;
    });
    const namesToDelete = [...existingNames].filter(name => !newNames.has(name));

    // Cancellazione tool obsoleti
    for (const name of namesToDelete) {
      try {
        await deleteToolDoc(pool, "tool_embeddings", name);
        deleted++;
      } catch (error) {
        console.error(`[syncDocsPgvectorStore] Errore cancellando tool '${name}':`, error);
        // Non rilancia qui, logga solo: continua ciclo
      }
    }

    // Aggiornamento embedding modificati
    for (const doc of docsToUpdate) {
      try {
        await deleteToolDoc(pool, "tool_embeddings", doc.metadata?.name);
        await vectorStore.addDocuments([doc]);
        updated++;
      } catch (error) {
        console.error(`[syncDocsPgvectorStore] Errore aggiornando '${doc.metadata?.name}':`, error);
      }
    }

    // Aggiunta nuovi tool
    if (docsToAdd.length > 0) {
      try {
        await vectorStore.addDocuments(docsToAdd);
        added = docsToAdd.length;
      } catch (error) {
        console.error("[syncDocsPgvectorStore] Errore aggiungendo nuovi tool:", error);
        // Qui puoi scegliere se rilanciare o solo loggare
      }
    }

    console.info(`[syncDocsPgvectorStore] Operazione completata: aggiunti=${added}, aggiornati=${updated}, cancellati=${deleted}`);
    return { added, updated, deleted };

  } catch (err) {
    console.error("[syncDocsPgvectorStore] Errore globale:", err);
    throw err; // Propaga per gestioni superiori, se serve
  }
}

export async function getExistingToolDocs(pool: Pool, tableName: string) {
  const { rows } = await pool.query(`SELECT id, description, metadata FROM ${tableName}`);
  return rows; // Array di documenti embeddati
}

export async function deleteToolDoc(pool: Pool, tableName: string, toolName: string) {
  await pool.query(`DELETE FROM ${tableName} WHERE metadata->>'name' = $1`, [toolName]);
}