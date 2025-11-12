import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import '../../../logger.js';
import { PostgresqlClient } from "./postgresq.client.js";

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
export function getPoolStats(): { totalCount: number; idleCount: number; waitingCount: number } {

    return POSTGRESQL_CLIENT_INSTANCE.getPoolStats();
}

