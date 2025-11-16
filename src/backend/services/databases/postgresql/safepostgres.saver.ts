
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import '../../../../core/logger.core.js';
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
      //throw error;
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
      return {
        ...config,
        // campi extra per segnalare l’errore
        _safeSaverError: true,
        _safeSaverErrorMessage: error instanceof Error ? error.message : String(error)
      } as RunnableConfig;
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
      //throw error;
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
      //throw error;
    }
  }
}