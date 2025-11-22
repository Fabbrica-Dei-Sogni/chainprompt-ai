import { MongoClientInstance } from '../mongodb.client.js';
import mongoose from 'mongoose';

// Mock mongoose
jest.mock('mongoose', () => ({
    connect: jest.fn(),
    connection: {
        on: jest.fn()
    }
}));

describe('MongoClientInstance', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    it('should connect to MongoDB on instantiation', () => {
        new MongoClientInstance();
        expect(mongoose.connect).toHaveBeenCalled();
    });

    it('should register event handlers', () => {
        new MongoClientInstance();
        expect(mongoose.connection.on).toHaveBeenCalledWith('connected', expect.any(Function));
        expect(mongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
        expect(mongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
    });

    it('should log on connected event', () => {
        new MongoClientInstance();

        // Get the 'connected' callback
        const connectedCallback = (mongoose.connection.on as jest.Mock).mock.calls.find(
            call => call[0] === 'connected'
        )?.[1];

        connectedCallback?.();
        expect(consoleLogSpy).toHaveBeenCalledWith('[mongoDB] Connected');
    });

    it('should log error on error event', () => {
        new MongoClientInstance();

        const errorCallback = (mongoose.connection.on as jest.Mock).mock.calls.find(
            call => call[0] === 'error'
        )?.[1];

        const testError = new Error('Connection failed');
        errorCallback?.(testError);
        expect(consoleErrorSpy).toHaveBeenCalledWith('[mongoDB] Errore nella connessione:', testError);
    });

    it('should log warning on disconnected event', () => {
        new MongoClientInstance();

        const disconnectedCallback = (mongoose.connection.on as jest.Mock).mock.calls.find(
            call => call[0] === 'disconnected'
        )?.[1];

        disconnectedCallback?.();
        expect(consoleWarnSpy).toHaveBeenCalledWith('[mongoDB] Connessione chiusa');
    });
});
