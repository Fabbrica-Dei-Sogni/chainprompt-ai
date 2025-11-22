/**
 * Base error class per tutti gli errori applicativi
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code: string;
    public readonly timestamp: string;

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR',
        isOperational: boolean = true
    ) {
        super(message);

        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();

        // Mantiene stack trace corretto
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            error: {
                message: this.message,
                code: this.code,
                statusCode: this.statusCode,
                timestamp: this.timestamp
            }
        };
    }
}

/**
 * 404 - Risorsa non trovata
 */
export class NotFoundError extends AppError {
    constructor(resource: string, identifier?: string) {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;

        super(message, 404, 'NOT_FOUND', true);
    }
}

/**
 * 400 - Errore di validazione input
 */
export class ValidationError extends AppError {
    public readonly fields?: Record<string, string>;

    constructor(message: string, fields?: Record<string, string>) {
        super(message, 400, 'VALIDATION_ERROR', true);
        this.fields = fields;
    }

    toJSON() {
        return {
            error: {
                message: this.message,
                code: this.code,
                statusCode: this.statusCode,
                timestamp: this.timestamp,
                ...(this.fields && { fields: this.fields })
            }
        };
    }
}

/**
 * 401 - Non autenticato
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED', true);
    }
}

/**
 * 403 - Non autorizzato
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Access forbidden') {
        super(message, 403, 'FORBIDDEN', true);
    }
}

/**
 * 409 - Conflitto (es. duplicato)
 */
export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT', true);
    }
}

/**
 * 500 - Errore interno server
 */
export class InternalServerError extends AppError {
    constructor(message: string = 'Internal server error', originalError?: Error) {
        super(message, 500, 'INTERNAL_ERROR', false);

        // Preserva stack trace originale se disponibile
        if (originalError) {
            this.stack = originalError.stack;
        }
    }
}

/**
 * 503 - Servizio non disponibile (es. DB down)
 */
export class ServiceUnavailableError extends AppError {
    constructor(service: string) {
        super(`Service ${service} is temporarily unavailable`, 503, 'SERVICE_UNAVAILABLE', true);
    }
}
