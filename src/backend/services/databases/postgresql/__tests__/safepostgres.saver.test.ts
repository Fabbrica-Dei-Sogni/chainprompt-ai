import { SafePostgresSaver } from '../safepostgres.saver.js';
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import type pg from "pg";

// Mock PostgresSaver
jest.mock("@langchain/langgraph-checkpoint-postgres");

describe('SafePostgresSaver', () => {
    let mockPool: any;
    let mockLogger: any;
    let saver: SafePostgresSaver;

    beforeEach(() => {
        jest.clearAllMocks();

        mockPool = {} as pg.Pool;
        mockLogger = {
            error: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
            log: jest.fn()
        };

        saver = new SafePostgresSaver(mockPool, undefined, undefined, mockLogger);
    });

    describe('setup', () => {
        it('should call super.setup successfully', async () => {
            const setupSpy = jest.spyOn(PostgresSaver.prototype, 'setup').mockResolvedValue(undefined);

            await saver.setup();

            expect(setupSpy).toHaveBeenCalled();
            expect(mockLogger.log).toHaveBeenCalledWith('[SafePostgresSaver] setup()');
        });

        it('should catch and log errors from super.setup', async () => {
            const error = new Error('Setup failed');
            const setupSpy = jest.spyOn(PostgresSaver.prototype, 'setup').mockRejectedValue(error);

            await saver.setup();

            expect(setupSpy).toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalledWith('[SafePostgresSaver] setup failed:', error);
        });
    });

    describe('put', () => {
        it('should call super.put successfully', async () => {
            const config = { configurable: { thread_id: '123' } };
            const checkpoint = {} as any;
            const metadata = {} as any;
            const newVersions = {} as any;
            const expectedResult = { ...config, configurable: { thread_id: '123', checkpoint_id: 'abc' } };

            const putSpy = jest.spyOn(PostgresSaver.prototype, 'put').mockResolvedValue(expectedResult);

            const result = await saver.put(config, checkpoint, metadata, newVersions);

            expect(putSpy).toHaveBeenCalledWith(config, checkpoint, metadata, newVersions);
            expect(result).toEqual(expectedResult);
        });

        it('should catch and log errors from super.put', async () => {
            const config = { configurable: { thread_id: '123' } };
            const checkpoint = {} as any;
            const metadata = {} as any;
            const newVersions = {} as any;
            const error = new Error('Put failed');

            const putSpy = jest.spyOn(PostgresSaver.prototype, 'put').mockRejectedValue(error);

            const result = await saver.put(config, checkpoint, metadata, newVersions);

            expect(putSpy).toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalled();
            expect(result).toHaveProperty('_safeSaverError', true);
            expect(result).toHaveProperty('_safeSaverErrorMessage', 'Put failed');
        });
    });

    describe('getTuple', () => {
        it('should call super.getTuple successfully', async () => {
            const config = { configurable: { thread_id: '123' } };
            const expectedTuple = {} as any;

            const getTupleSpy = jest.spyOn(PostgresSaver.prototype, 'getTuple').mockResolvedValue(expectedTuple);

            const result = await saver.getTuple(config);

            expect(getTupleSpy).toHaveBeenCalledWith(config);
            expect(result).toEqual(expectedTuple);
        });

        it('should catch and log errors from super.getTuple', async () => {
            const config = { configurable: { thread_id: '123' } };
            const error = new Error('GetTuple failed');

            const getTupleSpy = jest.spyOn(PostgresSaver.prototype, 'getTuple').mockRejectedValue(error);

            const result = await saver.getTuple(config);

            expect(getTupleSpy).toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalled();
            expect(result).toBeUndefined();
        });
    });

    describe('deleteThread', () => {
        it('should call super.deleteThread successfully', async () => {
            const threadId = '123';

            const deleteThreadSpy = jest.spyOn(PostgresSaver.prototype, 'deleteThread').mockResolvedValue(undefined);

            await saver.deleteThread(threadId);

            expect(deleteThreadSpy).toHaveBeenCalledWith(threadId);
        });

        it('should catch and log errors from super.deleteThread', async () => {
            const threadId = '123';
            const error = new Error('DeleteThread failed');

            const deleteThreadSpy = jest.spyOn(PostgresSaver.prototype, 'deleteThread').mockRejectedValue(error);

            await saver.deleteThread(threadId);

            expect(deleteThreadSpy).toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
});
