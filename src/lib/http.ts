/**
 * Small helpers for building JSON `Response` objects and parsing request bodies.
 * Route handlers stay thin and consistent by going through these.
 */

export function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init?.headers ?? {}) },
  });
}

export function jsonError(message: string, status: number): Response {
  return json({ error: message }, { status });
}

/** HTTP error that route handlers can throw to short-circuit with a status. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Parse a JSON body, throwing HttpError(400) on malformed input. */
export async function parseJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

/**
 * Wrap a route handler so thrown HttpErrors become JSON responses and any other
 * error becomes a generic 500 (without leaking internals to the client).
 */
export function withErrorHandling(
  handler: (req: Request, ctx?: any) => Promise<Response> | Response,
) {
  return async (req: Request, ctx?: any): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return jsonError(err.message, err.status);
      }
      console.error("Unhandled route error:", err);
      return jsonError("Internal server error", 500);
    }
  };
}
