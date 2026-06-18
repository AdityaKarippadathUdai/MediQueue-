import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
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
          field: err.path.slice(1).join('.'), // Remove the top-level 'body' or 'query' prefix
          message: err.message,
        }));
        return res.status(400).json({
          message: 'Validation failed',
          errors: errorMessages,
        });
      }
      next(error);
    }
  };
};

export default validate;
