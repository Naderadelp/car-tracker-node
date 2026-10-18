declare global {
  namespace Express {
    interface Request {
      // Set by the validate middleware: the parsed and coerced request input.
      validated: { body: unknown; params: unknown; query: unknown };
    }
  }
}

export {};
