import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import pg from "pg";

// Configurazione PostgreSQL
const DB_URI = process.env.POSTGRES_URI || 
  "postgresql://postgres:postgres@localhost:5432/agentdb?sslmode=disable";

const NAME_DB_MEMORY = process.env.NAME_DB_MEMORY || "agent_memory_default";

// Pool globale (singleton pattern)
let pool: pg.Pool | null = null;
let checkpointer: PostgresSaver | null = null;

export async function initPostgresql() {
    await initializeCheckpointer();

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('📭 SIGTERM ricevuto...');
        await closePool();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('📭 SIGINT ricevuto...');
        await closePool();
        process.exit(0);
    });
}

/**
 * Crea e restituisce il pool PostgreSQL (singleton)
 */
function getOrCreatePool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: DB_URI,
      max: 20, // max connessioni simultanee
      idleTimeoutMillis: 30000, // chiudi connessioni idle dopo 30s
      connectionTimeoutMillis: 2000, // timeout acquisizione connessione
      application_name: "langgraph-agent", // utile per debugging
    });

    // Event listeners per monitoraggio pool
    pool.on('error', (err) => {
      console.error('Errore non atteso nel pool PostgreSQL:', err);
    });

    pool.on('connect', () => {
      console.debug('Nuova connessione acquisita dal pool');
    });

    pool.on('remove', () => {
      console.debug('Connessione rimossa dal pool');
    });
  }

  return pool;
}

/**
 * Inizializza il checkpointer PostgreSQL (chiamare una sola volta all'avvio)
 */
async function initializeCheckpointer(retries = 3): Promise<PostgresSaver> {
    for (let i = 0; i < retries; i++) {
        try { 
            if (!checkpointer) {
                
                const pgPool = getOrCreatePool();
                checkpointer = new PostgresSaver(pgPool , undefined, {
                    schema: NAME_DB_MEMORY
                });
                await checkpointer.setup();
                console.info("PostgreSQL checkpointer inizializzato");
            }
            return checkpointer;
        } catch (error) {
            console.error(`Tentativo ${i + 1} fallito:`, error);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
    throw new Error("Impossibile inizializzare checkpointer");
};

/**
 * Restituisce il checkpointer inizializzato
 */
export function getCheckpointer(): PostgresSaver {
  if (!checkpointer) {
    throw new Error("Checkpointer non inizializzato. Chiamare initializeCheckpointer() prima.");
  }
  return checkpointer;
}

/**
 * Graceful shutdown del pool PostgreSQL
 */
async function closePool(): Promise<void> {
  if (pool) {
    console.info("Chiusura pool PostgreSQL...");
    await pool.end();
    pool = null;
    checkpointer = null;
    console.info("✓ Pool PostgreSQL chiuso");
  }
}

/**
 * Informazioni diagnostiche sul pool (utile per monitoraggio)
 */
export function getPoolStats(): { totalCount: number; idleCount: number; waitingCount: number } {
  if (!pool) {
    throw new Error("Pool non disponibile");
  }

  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

