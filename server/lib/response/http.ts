// ──────────────────────────────────────────────────────────────
// HTTP Response Helpers
// ──────────────────────────────────────────────────────────────
// Standard HTTP Response constructors for services and routes.
// ──────────────────────────────────────────────────────────────
import { messages } from "./messages";

// ──────────────────────────────────────────────────────────────
// Response Helpers
// ──────────────────────────────────────────────────────────────

/** Standard response helpers for service and route usage */
export const responses = {
  getNoAccess(message?: string): Response {
    return new Response(message || messages.NO_ACCESS, {
      status: 403,
      statusText: "Forbidden",
    });
  },
  getUnauthorized(message?: string): Response {
    return new Response(message || messages.UNAUTHORIZED, {
      status: 401,
      statusText: "Unauthorized",
    });
  },
  getNotFound(message?: string): Response {
    return new Response(message || messages.RESOURCE_NOT_FOUND, {
      status: 404,
      statusText: "Not Found",
    });
  },
  getBadRequest(message?: string): Response {
    return new Response(message || messages.BAD_REQUEST, {
      status: 400,
      statusText: "Bad Request",
    });
  },
  getConflict(message?: string): Response {
    return new Response(message || messages.CONFLICT, {
      status: 409,
      statusText: "Conflict",
    });
  },
  getUnprocessableEntity(errors: Record<string, string> & { general?: string }): Response {
    return new Response(JSON.stringify({ success: false, errors }), {
      status: 422,
      statusText: "Unprocessable Entity",
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
  getInternalError(message?: string): Response {
    return new Response(message || messages.INTERNAL_SERVER_ERROR, {
      status: 500,
      statusText: "Internal Server Error",
    });
  },
  getServiceUnavailable(message?: string): Response {
    return new Response(message || messages.SERVICE_UNAVAILABLE, {
      status: 503,
      statusText: "Service Unavailable",
    });
  },
  getTooManyRequests(message?: string): Response {
    return new Response(message || "Too many requests. Please try again later.", {
      status: 429,
      statusText: "Too Many Requests",
    });
  },
  json<T>(data: T, status: number = 200, statusText?: string): Response {
    return new Response(JSON.stringify(data), {
      status,
      statusText: statusText || (status >= 200 && status < 300 ? "OK" : "Error"),
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
  success<T>(data: T): Response {
    return this.json(data, 200, "OK");
  },
  created<T>(data: T): Response {
    return this.json(data, 201, "Created");
  },
  noContent(): Response {
    return new Response(null, {
      status: 204,
      statusText: "No Content",
    });
  },
};
