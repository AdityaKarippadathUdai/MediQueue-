import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendResponse } from '../utils/response';

/**
 * Zod schema validation middleware runner.
 * Formats errors and returns them in the standard response format.
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.slice(1).join('.'), // Remove top-level 'body' or 'query' prefix
          message: err.message,
        }));

        sendResponse(res, 400, false, 'Validation failed', { errors: errorMessages });
        return;
      }
      next(error);
    }
  };
};

export default validate;
