import 'reflect-metadata';
import type { PostgreSQLService as PostgreSQLServiceType } from '../postgresql.service.js';
import type { PostgresqlClient as PostgresqlClientType } from '../postgresq.client.js';

describe('PostgreSQLService', () => {
    let PostgreSQLService: typeof PostgreSQLServiceType;
    let PostgresqlClient: typeof PostgresqlClientType;
    let PGVectorStore: any;
    let mockContainer: any;
    let mockPostgresClient: any;

    beforeEach(async () => {
        jest.resetModules();
        jest.clearAllMocks();

        mockContainer = {
            getConfigEmbeddingsDFL: jest.fn().mockReturnValue({}),
            getInstanceEmbeddings: jest.fn().mockReturnValue({})
        };

        mockPostgresClient = {
            getOrCreatePool: jest.fn().mockReturnValue({ options: {} }),
            getCheckpointer: jest.fn().mockReturnValue({})
        };

        // Mock dependencies using doMock
        jest.doMock('../../../../../core/di/container.js', () => ({
            getComponent: jest.fn(() => mockContainer)
        }));

        jest.doMock('../postgresq.client.js', () => {
            return {
                PostgresqlClient: jest.fn(() => mockPostgresClient)
            };
        });

        jest.doMock('@langchain/community/vectorstores/pgvector', () => ({
            PGVectorStore: {
                initialize: jest.fn()
            }
        }));

        // Import modules dynamically
        const serviceModule = await import('../postgresql.service.js');
        PostgreSQLService = serviceModule.PostgreSQLService;

        const clientModule = await import('../postgresq.client.js');
        PostgresqlClient = clientModule.PostgresqlClient;

        const vectorStoreModule = await import('@langchain/community/vectorstores/pgvector');
        PGVectorStore = vectorStoreModule.PGVectorStore;

        // Reset singleton instance
        (PostgreSQLService as any).instance = null;
    });

    describe('getInstance', () => {
        it('should return singleton instance', () => {
            const instance1 = PostgreSQLService.getInstance();
            const instance2 = PostgreSQLService.getInstance();
            expect(instance1).toBe(instance2);
            // PostgresqlClient is called once per getInstance call when instance is null
            // Since we reset in beforeEach, we can't reliably test call count across tests
        });
    });

    describe('getCheckpointer', () => {
        it('should delegate to PostgresqlClient', () => {
            const instance = PostgreSQLService.getInstance();
            instance.getCheckpointer();
            expect(mockPostgresClient.getCheckpointer).toHaveBeenCalled();
        });
    });

    describe('getKyselyDatabase', () => {
        it('should return Kysely instance', () => {
            const instance = PostgreSQLService.getInstance();
            const db = instance.getKyselyDatabase();
            expect(db).toBeDefined();
        });
    });

    describe('getVectorStoreSingleton', () => {
        it('should initialize and return vector store', async () => {
            const instance = PostgreSQLService.getInstance();
            (PGVectorStore.initialize as jest.Mock).mockResolvedValue({} as any);

            const vectorStore = await instance.getVectorStoreSingleton();

            expect(mockContainer.getInstanceEmbeddings).toHaveBeenCalled();
            expect(PGVectorStore.initialize).toHaveBeenCalled();
            expect(vectorStore).toBeDefined();
        });

        it('should return existing vector store if already initialized', async () => {
            const instance = PostgreSQLService.getInstance();
            (PGVectorStore.initialize as jest.Mock).mockResolvedValue({} as any);

            await instance.getVectorStoreSingleton();
            const vectorStore = await instance.getVectorStoreSingleton();

            expect(PGVectorStore.initialize).toHaveBeenCalledTimes(1);
            expect(vectorStore).toBeDefined();
        });
    });
});
