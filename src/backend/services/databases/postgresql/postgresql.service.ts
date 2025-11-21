import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import '../../../../backend/logger.backend.js';
import { PostgresqlClient } from "./postgresq.client.js";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { llmEmbeddingsService } from "../../../../core/services/llm-embeddings.service.js";
import { EmbeddingProvider } from "../../../../core/enums/embeddingprovider.enum.js";
import { ConfigEmbeddings } from "../../../../core/interfaces/protocol/configembeddings.interface.js";
import { Embeddings } from "@langchain/core/embeddings";
import { converterModels } from "../../../../core/converter.models.js";
import { Kysely, PostgresDialect } from "kysely";
import { Database } from "./models/database.js";
import { VectorStoreConfig } from "./models/vectorstoreconfig.js";

const DEFAULT_VECTORSTORE_CONFIG: VectorStoreConfig = {
  tableName: "tool_embeddings",
  idColumnName: "id",
  vectorColumnName: "embedding",
  contentColumnName: "description",
  metadataColumnName: "metadata",
};

export class PostgreSQLService {
  private static instance: PostgreSQLService;
  private postgresClient: PostgresqlClient;
  private kyselyDatabase: Kysely<Database>;
  private vectorStoreInstance: PGVectorStore | null = null;

  private constructor() {
    this.postgresClient = new PostgresqlClient();
    this.kyselyDatabase = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: this.postgresClient.getOrCreatePool(),
      }),
    });
  }

  public static getInstance(): PostgreSQLService {
    if (!PostgreSQLService.instance) {
      PostgreSQLService.instance = new PostgreSQLService();
    }
    return PostgreSQLService.instance;
  }

  public getCheckpointer(): PostgresSaver {
    return this.postgresClient.getCheckpointer();
  }

  public getKyselyDatabase(): Kysely<Database> {
    return this.kyselyDatabase;
  }

  public async getVectorStoreSingleton(
    config: ConfigEmbeddings = converterModels.getConfigEmbeddingsDFL(),
    vectorStoreConfig: VectorStoreConfig = DEFAULT_VECTORSTORE_CONFIG
  ): Promise<PGVectorStore> {
    if (this.vectorStoreInstance) return this.vectorStoreInstance;

    const embeddings: Embeddings = llmEmbeddingsService.getInstanceEmbeddings(config);
    let pool = this.postgresClient.getOrCreatePool();

    this.vectorStoreInstance = await PGVectorStore.initialize(embeddings, {
      postgresConnectionOptions: pool.options, // usa quello che hai già istanziato
      tableName: vectorStoreConfig.tableName,
      columns: {
        idColumnName: vectorStoreConfig.idColumnName,
        vectorColumnName: vectorStoreConfig.vectorColumnName,
        contentColumnName: vectorStoreConfig.contentColumnName,
        metadataColumnName: vectorStoreConfig.metadataColumnName,
      },
    });
    return this.vectorStoreInstance;
  }
}

export const postgresqlService = PostgreSQLService.getInstance();