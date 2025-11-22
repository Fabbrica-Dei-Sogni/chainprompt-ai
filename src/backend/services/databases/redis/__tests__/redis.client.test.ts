// Mock redis module
const mockClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn()
};

jest.mock('redis', () => ({
    createClient: jest.fn(() => mockClient)
}));

// Mock logger backend to prevent interception
jest.mock('../../../../../backend/logger.backend.js', () => ({}));

describe('RedisClient', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let createClient: jest.Mock;

    beforeAll(() => {
        const redis = require('redis');
        createClient = redis.createClient;
    });

    beforeEach(() => {
        jest.clearAllMocks();

        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        mockClient.connect.mockClear();
        mockClient.on.mockClear();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    it('should create Redis client with correct configuration', () => {
        process.env.REDIS_HOST = 'localhost';
        process.env.REDIS_PORT = '6379';
        process.env.REDIS_PASSWORD = 'testpass';
        process.env.REDIS_DB = '1';

        // Force re-import
        jest.isolateModules(() => {
            require('../redis.client.js');
        });

        expect(createClient).toHaveBeenCalledWith({
            url: 'redis://localhost:6379',
            password: 'testpass',
            database: 1,
            socket: {
                reconnectStrategy: expect.any(Function),
                connectTimeout: 5000
            }
        });
    });

    it('should register error handler', () => {
        jest.isolateModules(() => {
            require('../redis.client.js');
        });

        expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle errors correctly', () => {
        jest.isolateModules(() => {
            require('../redis.client.js');
        });

        const errorCallback = mockClient.on.mock.calls.find(
            (call: any[]) => call[0] === 'error'
        )?.[1];

        const testError = new Error('Redis connection failed');
        errorCallback?.(testError);

        expect(consoleErrorSpy).toHaveBeenCalledWith('[Redis] Error:', testError);
    });

    it('should connect to Redis', async () => {
        jest.isolateModules(() => {
            require('../redis.client.js');
        });

        // Wait for async connectRedis
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should log on successful connection', async () => {
        jest.isolateModules(() => {
            require('../redis.client.js');
        });

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(consoleLogSpy).toHaveBeenCalledWith('[Redis] Connected.');
    });

    it('should implement reconnect strategy', () => {
        jest.isolateModules(() => {
            require('../redis.client.js');
        });

        const config = createClient.mock.calls[createClient.mock.calls.length - 1][0];
        const reconnectStrategy = config.socket.reconnectStrategy;

        // Test retry delays
        expect(reconnectStrategy(1)).toBe(100);
        expect(reconnectStrategy(2)).toBe(200);
        expect(reconnectStrategy(5)).toBe(500);

        // Test max retries (> 5 returns error)
        const result = reconnectStrategy(6);
        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe('Too many attempts to reconnect to Redis');
    });
});
