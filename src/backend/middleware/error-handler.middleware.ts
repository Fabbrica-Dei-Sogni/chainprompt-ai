import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { AppError } from '../errors/custom-errors.js';

/**
 * Middleware centralizzato per gestione errori
 * DEVE essere registrato come ULTIMO middleware in server.ts
 */
export function errorHandler(logger: Logger) {
    return (err: Error, req: Request, res: Response, next: NextFunction) => {

        // Dati base per logging
        const errorContext = {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            timestamp: new Date().toISOString()
        };

        // Se è un AppError (errore operazionale gestito)
        if (err instanceof AppError) {

            // Log livello WARN per operational errors
            logger.warn('Operational error occurred', {
                ...errorContext,
                statusCode: err.statusCode,
                code: err.code,
                isOperational: err.isOperational
            });

            // Response strutturata
            return res.status(err.statusCode).json(err.toJSON());
        }

        // Errori non gestiti (programming errors)
        // Log livello ERROR per unexpected errors
        logger.error('Unexpected error occurred', {
            ...errorContext,
            type: err.constructor.name,
            isOperational: false
        });

        // In produzione nascondi dettagli errori non gestiti
        const message = process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message;

        return res.status(500).json({
            error: {
                message,
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                timestamp: new Date().toISOString()
            }
        });
    };
}

/**
 * Middleware per gestire 404 (route non trovata)
 * Da registrare DOPO tutte le route ma PRIMA del errorHandler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
    const error = new AppError(
        `Route ${req.method} ${req.originalUrl} not found`,
        404,
        'ROUTE_NOT_FOUND',
        true
    );
    next(error);
}
