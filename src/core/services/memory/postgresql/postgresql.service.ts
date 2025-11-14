import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import '../../../../logger.js';
import { PostgresqlClient } from "./postgresq.client.js";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { getInstanceEmbeddings } from "../../reasoning/llm-embeddings.service.js";
import { EmbeddingProvider } from "../../../models/embeddingprovider.enum.js";
import { ConfigEmbeddings } from "../../../interfaces/configembeddings.interface.js";
import { Embeddings } from "@langchain/core/embeddings";
import { getConfigEmbeddingsDFL } from "../../../models/converter.models.js";
import { Kysely, PostgresDialect } from "kysely";
import { Database } from "./model/database.js";
import { VectorStoreConfig } from "./model/vectorstoreconfig.js";

/**
 * Istanza singleton oriented per fornire all'applicazione il checkpointer e altre informazioni future sullo schema postgresql
 */
export const POSTGRESQL_CLIENT_INSTANCE = new PostgresqlClient();

export const KYSELY_DATABASE = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: POSTGRESQL_CLIENT_INSTANCE.getOrCreatePool(),
  }),
});

/**
 * Restituisce il checkpointer inizializzato
 */
export function getCheckpointer(): PostgresSaver {
    return POSTGRESQL_CLIENT_INSTANCE.getCheckpointer();
}

const DEFAULT_VECTORSTORE_CONFIG: VectorStoreConfig = {
  tableName: "tool_embeddings",
  idColumnName: "id",
  vectorColumnName: "embedding",
  contentColumnName: "description",
  metadataColumnName: "metadata",
};

let VECTORSTORE_INSTANCE: PGVectorStore | null = null;

/**
 * Inizializza il vector store singleton con il provider embedding specificato.
 * @param provider - enum (OpenAI, Ollama, ecc)
 * @param config   - configurazione embedding
 * @param pool     - pg.Pool centralizzato
 * @param vectorStoreConfig - configurazione tabella/colonne (opzionale)
 * @returns {Promise<PGVectorStore>}
 */
export async function getVectorStoreSingleton(
  provider: EmbeddingProvider = EmbeddingProvider.Ollama,
  config: ConfigEmbeddings = getConfigEmbeddingsDFL(),
  vectorStoreConfig: VectorStoreConfig = DEFAULT_VECTORSTORE_CONFIG
): Promise<PGVectorStore> {
  if (VECTORSTORE_INSTANCE) return VECTORSTORE_INSTANCE;

  const embeddings: Embeddings = getInstanceEmbeddings(provider, config);
  let pool = POSTGRESQL_CLIENT_INSTANCE.getOrCreatePool();

  VECTORSTORE_INSTANCE = await PGVectorStore.initialize(embeddings, {
    postgresConnectionOptions: pool.options, // usa quello che hai già istanziato
    tableName: vectorStoreConfig.tableName,
    columns: {
      idColumnName: vectorStoreConfig.idColumnName,
      vectorColumnName: vectorStoreConfig.vectorColumnName,
      contentColumnName: vectorStoreConfig.contentColumnName,
      metadataColumnName: vectorStoreConfig.metadataColumnName,
    },
  });
  return VECTORSTORE_INSTANCE;
};