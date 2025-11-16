import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import pg from "pg";
import '../../../logger.core.js';
import { SafePostgresSaver } from "./safepostgres.saver.js";

/**
 * Istanza client per accedere al checkpointer degli agenti su postgresql 
 */
export class PostgresqlClient {

    // Configurazione PostgreSQL
    private DB_URI = process.env.POSTGRES_URI ||
        "postgresql://postgres:postgres@localhost:5432/agentdb?sslmode=disable";

    private NAME_DB_MEMORY = process.env.NAME_DB_MEMORY || "agent_memory_default";

    // Pool globale (singleton pattern)
    private pool: pg.Pool | null = null;

    private checkpointer: SafePostgresSaver | null = null;

    constructor() {
        this.initializeCheckpointer();

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('📭 SIGTERM ricevuto...');
            await this.closePool();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            console.log('📭 SIGINT ricevuto...');
            await this.closePool();
            process.exit(0);
        });

    }
    /**
     * Crea e restituisce il pool PostgreSQL (singleton)
     */
    public getOrCreatePool(): pg.Pool {
        if (!this.pool) {
            this.pool = new pg.Pool({
                connectionString: this.DB_URI,
                max: 20, // max connessioni simultanee
                idleTimeoutMillis: 30000, // chiudi connessioni idle dopo 30s
                connectionTimeoutMillis: 2000, // timeout acquisizione connessione
                application_name: "langgraph-agent", // utile per debugging
            });

            // Event listeners per monitoraggio pool
            this.pool.on('error', (err) => {
                console.error('Errore non atteso nel pool PostgreSQL:', err);
            });

            this.pool.on('connect', () => {
                console.debug('Nuova connessione acquisita dal pool');
            });

            this.pool.on('remove', () => {
                console.debug('Connessione rimossa dal pool');
            });
        }

        return this.pool;
    }

    /**
     * Inizializza il checkpointer PostgreSQL (chiamare una sola volta all'avvio)
     */
    async initializeCheckpointer(retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                if (!this.checkpointer) {

                    const pgPool = this.getOrCreatePool();
                    this.checkpointer = new SafePostgresSaver(pgPool, undefined, {
                        schema: this.NAME_DB_MEMORY
                    });
                    await this.checkpointer.setup();
                    console.info("PostgreSQL checkpointer inizializzato");
                }
                this.checkpointer;
                break;

            } catch (error) {
                console.error(`Tentativo ${i + 1} fallito:`, error);
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
            }
        }
        //se dopo enne tentativi non riesce a ritornare il checkpoint fornisce errore.
        if (!this.checkpointer)
            throw new Error("Impossibile inizializzare checkpointer");
    };

    /**
     * Restituisce il checkpointer inizializzato
     */
    public getCheckpointer(): PostgresSaver {
        if (!this.checkpointer) {
            throw new Error("Checkpointer non inizializzato. Chiamare initializeCheckpointer() prima.");
        }
        return this.checkpointer;
    }

    /**
     * Graceful shutdown del pool PostgreSQL
     */
    async closePool(): Promise<void> {
        if (this.pool) {
            console.info("Chiusura pool PostgreSQL...");
            await this.pool.end();
            this.pool = null;
            this.checkpointer = null;
            console.info("✓ Pool PostgreSQL chiuso");
        }
    }

    /**
     * Informazioni diagnostiche sul pool (utile per monitoraggio)
     */
    public getPoolStats(): { totalCount: number; idleCount: number; waitingCount: number } {
        if (!this.pool) {
            throw new Error("Pool non disponibile");
        }

        return {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount
        };
    };

};