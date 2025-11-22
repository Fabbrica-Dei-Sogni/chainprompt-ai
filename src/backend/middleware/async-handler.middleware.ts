import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrapper per route handler async che elimina necessità di try/catch
 * 
 * Usage:
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.findAll();
 *   res.json(users);
 * }));
 * 
 * Se userService.findAll() throws, l'errore viene automaticamente
 * passato al error handler middleware
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        return Promise.resolve(fn(req, res, next)).catch(next);
    };
};
