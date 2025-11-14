import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import '../../../../logger.js';
import { PostgresqlClient } from "./postgresq.client.js";
import type {
    ChannelVersions,
    Checkpoint,
    CheckpointListOptions,
    CheckpointMetadata,
    CheckpointTuple,
    PendingWrite,
    SerializerProtocol,
} from "@langchain/langgraph-checkpoint";
import type pg from "pg";
import type { RunnableConfig } from "@langchain/core/runnables";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { getInstanceEmbeddings } from "../../reasoning/llm-embeddings.service.js";
import { EmbeddingProvider } from "../../../models/embeddingprovider.enum.js";
import { ConfigEmbeddings } from "../../../interfaces/configembeddings.interface.js";
import { Embeddings } from "@langchain/core/embeddings";
import { getConfigEmbeddingsDFL } from "../../../models/converter.models.js";

// Logger generico, personalizzabile
type LoggerLike = { error: (...args: any[]) => void; warn?: (...args: any[]) => void, info?: (...args: any[]) => void, log?: (...args: any[]) => void };

export class SafePostgresSaver extends PostgresSaver {
  private readonly logger: LoggerLike;

  constructor(
    pool: pg.Pool,
    serde?: SerializerProtocol,
    options?: Partial<{ schema: string }>,
    logger?: LoggerLike
  ) {
    super(pool, serde, options);
    this.logger = logger ?? console; // fallback a console.log
  }

  override async setup(): Promise<void> {
    this.logger.log?.("[SafePostgresSaver] setup()");
    try {
      await super.setup();
    } catch (error) {
      this.logger.error("[SafePostgresSaver] setup failed:", error);
      throw error;
    }
  }

  override async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    newVersions: ChannelVersions
  ): Promise<RunnableConfig> {
    //this.logger.log?.("[SafePostgresSaver] put()", { config, checkpoint, metadata, newVersions });
    try {
      return await super.put(config, checkpoint, metadata, newVersions);
    } catch (error) {
      this.logger.error("[SafePostgresSaver] put failed:", { error, config, checkpoint, metadata, newVersions });
      throw error;
    }
  }

  override async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string
  ): Promise<void> {
    //this.logger.log?.("[SafePostgresSaver] putWrites()", { config, writes, taskId });
    try {
      await super.putWrites(config, writes, taskId);
    } catch (error) {
      this.logger.error("[SafePostgresSaver] putWrites failed:", { error, config, writes, taskId });
      throw error;
    }
  }

  override async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    //this.logger.log?.("[SafePostgresSaver] getTuple()", { config });
    try {
      return await super.getTuple(config);
    } catch (error) {
      this.logger.error("[SafePostgresSaver] getTuple failed:", { error, config });
      return undefined;
    }
  }

  override async *list(
    config: RunnableConfig,
    options?: CheckpointListOptions
  ): AsyncGenerator<CheckpointTuple, any, any> {
    //this.logger.log?.("[SafePostgresSaver] list()", { config, options });
    try {
      yield* super.list(config, options);
    } catch (error) {
      this.logger.error("[SafePostgresSaver] list failed:", { error, config, options });
    }
  }

  override async end(): Promise<void> {
    //this.logger.log?.("[SafePostgresSaver] end()");
    try {
      await super.end();
    } catch (error) {
      this.logger.error("[SafePostgresSaver] end failed:", error);
    }
  }

  override async deleteThread(threadId: string): Promise<void> {
    //this.logger.log?.("[SafePostgresSaver] deleteThread()", { threadId });
    try {
      await super.deleteThread(threadId);
    } catch (error) {
      this.logger.error("[SafePostgresSaver] deleteThread failed:", { error, threadId });
      throw error;
    }
  }
}

/**
 * Istanza singleton oriented per fornire all'applicazione il checkpointer e altre informazioni future sullo schema postgresql
 */
export const POSTGRESQL_CLIENT_INSTANCE = new PostgresqlClient();


/**
 * Restituisce il checkpointer inizializzato
 */
export function getCheckpointer(): PostgresSaver {
    return POSTGRESQL_CLIENT_INSTANCE.getCheckpointer();
}



/**
 * Informazioni diagnostiche sul pool (utile per monitoraggio)
 */
function getPoolStats(): { totalCount: number; idleCount: number; waitingCount: number } {

    return POSTGRESQL_CLIENT_INSTANCE.getPoolStats();
};


// Configurazione tabella e colonne: può essere parametrica se vuoi multi-store
export interface VectorStoreConfig {
  tableName: string;
  idColumnName: string;
  vectorColumnName: string;
  contentColumnName: string;
  metadataColumnName?: string;
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
