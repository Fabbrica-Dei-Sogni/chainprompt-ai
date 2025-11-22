import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from '../error-handler.middleware.js';
import { AppError } from '../../errors/custom-errors.js';
import { Logger } from 'winston';

describe('Error Handler Middleware', () => {
    let mockLogger: jest.Mocked<Logger>;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        mockLogger = {
            warn: jest.fn(),
            error: jest.fn()
        } as any;

        mockReq = {
            originalUrl: '/test/path',
            method: 'GET',
            ip: '127.0.0.1',
            get: jest.fn((header: string) => header === 'user-agent' ? 'test-agent' : undefined)
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();
    });

    describe('errorHandler', () => {
        it('should handle AppError (operational error)', () => {
            const appError = new AppError('Test error', 400, 'TEST_ERROR', true);
            const handler = errorHandler(mockLogger);

            handler(appError, mockReq as Request, mockRes as Response, mockNext);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Operational error occurred',
                expect.objectContaining({
                    message: 'Test error',
                    statusCode: 400,
                    code: 'TEST_ERROR',
                    isOperational: true
                })
            );

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        message: 'Test error',
                        code: 'TEST_ERROR',
                        statusCode: 400
                    })
                })
            );
        });

        it('should handle unexpected errors in development', () => {
            const unexpectedError = new Error('Unexpected error');
            const handler = errorHandler(mockLogger);
            process.env.NODE_ENV = 'development';

            handler(unexpectedError, mockReq as Request, mockRes as Response, mockNext);

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Unexpected error occurred',
                expect.objectContaining({
                    message: 'Unexpected error',
                    type: 'Error',
                    isOperational: false
                })
            );

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        message: 'Unexpected error',
                        code: 'INTERNAL_ERROR',
                        statusCode: 500
                    })
                })
            );
        });

        it('should hide error details in production', () => {
            const unexpectedError = new Error('Sensitive error details');
            const handler = errorHandler(mockLogger);
            process.env.NODE_ENV = 'production';

            handler(unexpectedError, mockReq as Request, mockRes as Response, mockNext);

            expect(mockLogger.error).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        message: 'An unexpected error occurred',
                        code: 'INTERNAL_ERROR',
                        statusCode: 500
                    })
                })
            );
        });

        it('should include request context in logs', () => {
            const error = new Error('Test error');
            const handler = errorHandler(mockLogger);

            handler(error, mockReq as Request, mockRes as Response, mockNext);

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Unexpected error occurred',
                expect.objectContaining({
                    url: '/test/path',
                    method: 'GET',
                    ip: '127.0.0.1',
                    userAgent: 'test-agent'
                })
            );
        });
    });

    describe('notFoundHandler', () => {
        it('should create AppError for 404 and call next', () => {
            mockReq.method = 'POST';
            mockReq.originalUrl = '/api/nonexistent';

            notFoundHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Route POST /api/nonexistent not found',
                    statusCode: 404,
                    code: 'ROUTE_NOT_FOUND',
                    isOperational: true
                })
            );
        });
    });
});
