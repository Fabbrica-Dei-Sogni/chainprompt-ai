import { OpenAIEmbeddings } from "@langchain/openai";
import { CacheBackedEmbeddings } from "@langchain/classic/embeddings/cache_backed";
import { AzureOpenAIEmbeddings } from "@langchain/openai"; // Per Azure
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { VertexAIEmbeddings } from "@langchain/google-vertexai"; // Per Google
import { Embeddings } from "@langchain/core/embeddings"; // Base class
import { InMemoryStore } from "@langchain/core/stores"; // O RedisStore per il tuo setup
import { OllamaEmbeddings, } from "@langchain/ollama";
import { ConfigEmbeddings } from "../interfaces/protocol/configembeddings.interface.js";
import { EmbeddingProvider } from "../enums/embeddingprovider.enum.js";
import { injectable } from "tsyringe";

@injectable()
export class LLMEmbeddingsService {

  constructor() {} // costruttore pubblico standard


  /**
   * Ritorna l'istanza di un embedding model in base al provider scelto.
   * 
   * @param provider - EmbeddingProvider enum
   * @param config - Configurazione specifica
   * @returns Embeddings instance
   */
  public getInstanceEmbeddings(config: ConfigEmbeddings) {
    let instance: Embeddings;
    let provider = config.provider;
    switch (provider) {
      case EmbeddingProvider.OpenAI:
        instance = this.getOpenAIEmbeddings(config);
        break;
      case EmbeddingProvider.AzureOpenAI:
        instance = this.getAzureOpenAIEmbeddings(config);
        break;
      case EmbeddingProvider.Ollama:
        instance = this.getOllamaEmbeddings(config);
        break;
      case EmbeddingProvider.HuggingFace:
        instance = this.getHuggingFaceEmbeddings(config);
        break;
      case EmbeddingProvider.HuggingFaceLocal:
        instance = this.getHuggingFaceLocalEmbeddings(config);
        break;
      case EmbeddingProvider.GoogleVertexAI:
        instance = this.getGoogleVertexAIEmbeddings(config);
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

  private getOpenAIEmbeddings(config: ConfigEmbeddings) {
    const embeddings = new OpenAIEmbeddings({
      model: config.modelname, // Es. 'text-embedding-3-small'
      apiKey: process.env.OPENAI_API_KEY,
      dimensions: config.dimension || 1536, // Dimensione vettoriale
      timeout: config.timeout || 30000,
    });
    return embeddings;
  };

  private getAzureOpenAIEmbeddings(config: ConfigEmbeddings) {
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

  private getOllamaEmbeddings(config: ConfigEmbeddings) {
    const embeddings = new OllamaEmbeddings({
      model: config.modelname || 'mxbai-embed-large', // Es. 'nomic-embed-text'
      baseUrl: config.baseUrl || process.env.URI_LANGCHAIN_OLLAMA,
      //requestTimeout: config.timeout || 30000,
      // Aggiungi parametri specifici come numCtx se necessario
    });
    return embeddings;
  };

  private getHuggingFaceEmbeddings(config: ConfigEmbeddings) {
    const embeddings = new HuggingFaceInferenceEmbeddings({
      model: config.modelname, // Es. 'sentence-transformers/all-MiniLM-L6-v2'
      apiKey: process.env.HUGGINGFACEHUB_API_TOKEN,
    });
    return embeddings;
  };

  private getHuggingFaceLocalEmbeddings(config: ConfigEmbeddings) {
    const embeddings = new HuggingFaceTransformersEmbeddings({
      model: config.modelname,
      // Non richiede API key, modelli locali scaricati
    });
    return embeddings;
  };

  private getGoogleVertexAIEmbeddings(config: ConfigEmbeddings) {
    const embeddings = new VertexAIEmbeddings({
      model: config.modelname, // Es. 'textembedding-gecko'
      //project: process.env.GOOGLE_PROJECT_ID,
      location: process.env.GOOGLE_LOCATION || 'us-central1',
      dimensions: config.dimension || 768,
    });
    return embeddings;
  };
}
