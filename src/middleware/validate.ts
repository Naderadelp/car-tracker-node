import type { RequestHandler } from 'express';
import type { z } from 'zod';

type Schemas = { body?: z.ZodType; params?: z.ZodType; query?: z.ZodType };

// Like a Laravel FormRequest: parse the input, or throw a ZodError that the error
// handler turns into a 422. Express 5 makes req.query read-only, so the parsed values
// go on req.validated instead of replacing the originals.
export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    req.validated = {
      body: schemas.body ? schemas.body.parse(req.body) : undefined,
      params: schemas.params ? schemas.params.parse(req.params) : undefined,
      query: schemas.query ? schemas.query.parse(req.query) : undefined,
    };
    next();
  };
}
