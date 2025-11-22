import { PostgresqlClient } from '../postgresq.client.js';
import pg from 'pg';
import { SafePostgresSaver } from '../safepostgres.saver.js';

// Mock dependencies
jest.mock('pg', () => {
    const mPool = {
        on: jest.fn(),
        end: jest.fn(),
        totalCount: 10,
        idleCount: 5,
        waitingCount: 0,
        options: {}
    };
    return {
        Pool: jest.fn(() => mPool),
    };
});

jest.mock('../safepostgres.saver.js');

describe('PostgresqlClient', () => {
    let client: PostgresqlClient;
    let mockPool: any;

    beforeEach(() => {
        jest.clearAllMocks();
        // Do not instantiate client here
    });

    describe('getOrCreatePool', () => {
        it('should create a new pool if not exists', () => {
            client = new PostgresqlClient();
            const pool = client.getOrCreatePool();
            expect(pg.Pool).toHaveBeenCalled(); // Called by constructor via initializeCheckpointer -> getOrCreatePool
            expect(pool).toBeDefined();
        });

        it('should return existing pool if already created', () => {
            client = new PostgresqlClient();
            // getOrCreatePool is called in constructor
            const pool1 = client.getOrCreatePool();
            const pool2 = client.getOrCreatePool();
            expect(pool1).toBe(pool2);
        });
    });

    describe('initializeCheckpointer', () => {
        it('should initialize checkpointer successfully', async () => {
            const mockCheckpointer = {
                setup: jest.fn().mockResolvedValue(undefined)
            };
            (SafePostgresSaver as unknown as jest.Mock).mockImplementation(() => mockCheckpointer);

            client = new PostgresqlClient();

            // Wait for the async operation in constructor to potentially finish? 
            // We can't easily await the constructor's async call.
            // But we can call initializeCheckpointer again and await it.
            // However, if the first one is still running or finished, we need to know.

            // Since we mocked SafePostgresSaver, the constructor call will use this mock.
            // We can verify that SafePostgresSaver was called.

            expect(SafePostgresSaver).toHaveBeenCalled();
            // We can't guarantee setup is called immediately because it's async.
            // Let's wait a bit or use setImmediate?
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockCheckpointer.setup).toHaveBeenCalled();
        });

        it('should retry on failure', async () => {
            const mockCheckpointer = {
                setup: jest.fn().mockResolvedValue(undefined)
            };

            let callCount = 0;
            (SafePostgresSaver as unknown as jest.Mock).mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('Setup failed');
                }
                return mockCheckpointer;
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            // Prevent constructor from running it
            const initSpy = jest.spyOn(PostgresqlClient.prototype, 'initializeCheckpointer').mockImplementation(async () => { });
            client = new PostgresqlClient();
            initSpy.mockRestore();

            // Call explicitly
            await client.initializeCheckpointer();

            expect(SafePostgresSaver).toHaveBeenCalledTimes(2);
            consoleSpy.mockRestore();
        });

        it('should throw error after max retries', async () => {
            (SafePostgresSaver as unknown as jest.Mock).mockImplementation(() => {
                throw new Error('Always fails');
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            // Prevent constructor from running it
            const initSpy = jest.spyOn(PostgresqlClient.prototype, 'initializeCheckpointer').mockImplementation(async () => { });
            client = new PostgresqlClient();
            initSpy.mockRestore();

            await expect(client.initializeCheckpointer(2)).rejects.toThrow('Always fails');

            expect(SafePostgresSaver).toHaveBeenCalledTimes(2);
            consoleSpy.mockRestore();
        });
    });

    describe('getCheckpointer', () => {
        it('should return checkpointer if initialized', async () => {
            const mockCheckpointer = {
                setup: jest.fn().mockResolvedValue(undefined)
            };
            (SafePostgresSaver as unknown as jest.Mock).mockImplementation(() => mockCheckpointer);

            client = new PostgresqlClient();
            await new Promise(resolve => setTimeout(resolve, 10));

            const result = client.getCheckpointer();
            expect(result).toBe(mockCheckpointer);
        });

        it('should throw if not initialized', () => {
            // Mock initializeCheckpointer to do nothing, so checkpointer remains null
            const initSpy = jest.spyOn(PostgresqlClient.prototype, 'initializeCheckpointer').mockImplementation(async () => { });

            client = new PostgresqlClient();

            expect(() => client.getCheckpointer()).toThrow('Checkpointer non inizializzato');

            initSpy.mockRestore();
        });
    });

    describe('closePool', () => {
        it('should close pool if exists', async () => {
            client = new PostgresqlClient();
            const pool = client.getOrCreatePool();
            await client.closePool();
            expect(pool.end).toHaveBeenCalled();
        });

        it('should do nothing if pool does not exist', async () => {
            // How to have no pool? Constructor creates it.
            // We can mock getOrCreatePool to return null? No, it returns pg.Pool.
            // We can manually set pool to null? Private property.
            client = new PostgresqlClient();
            (client as any).pool = null;
            await client.closePool();
            // No error
        });
    });

    describe('getPoolStats', () => {
        it('should return stats', () => {
            client = new PostgresqlClient();
            const stats = client.getPoolStats();
            expect(stats).toEqual({
                totalCount: 10,
                idleCount: 5,
                waitingCount: 0
            });
        });

        it('should throw if pool not available', () => {
            client = new PostgresqlClient();
            (client as any).pool = null;
            expect(() => client.getPoolStats()).toThrow('Pool non disponibile');
        });
    });
});
