import type { ErrorRequestHandler, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/errors.ts';

function sendError(res: Response, status: number, message: string, details: unknown = null) {
  res.status(status).json({ error: { message, details } });
}

// Errors raised by Express itself (e.g. body-parser) carry a status and `expose: true`.
function isClientHttpError(err: unknown): err is { status: number; message: string; type?: string } {
  if (typeof err !== 'object' || err === null) return false;
  const { status, expose } = err as { status?: unknown; expose?: unknown };
  return typeof status === 'number' && status >= 400 && status < 500 && expose === true;
}

// Registered last in app.ts. Express 5 sends every thrown error (sync or async) here.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    sendError(res, err.status, err.message, err.details);
  } else if (err instanceof z.ZodError) {
    sendError(res, 422, 'Validation failed', z.flattenError(err));
  } else if (isClientHttpError(err)) {
    const message = err.type === 'entity.parse.failed' ? 'Malformed JSON body' : err.message;
    sendError(res, err.status, message);
  } else {
    console.error(err);
    sendError(res, 500, 'Internal server error');
  }
};
