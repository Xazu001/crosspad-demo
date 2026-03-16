// ──────────────────────────────────────────────────────────────
// Imports
// ──────────────────────────────────────────────────────────────
import { CacheManager, QueueManager, type RateLimiter, TotpManager } from "$/cloudflare";
import type { Database } from "$/core";

import type { Compilable } from "kysely";

import {
  type FormErrors,
  type FormResponseError,
  type FormResponseSuccess,
  RateLimitFormResult,
  getMessage,
  responses,
} from "../lib/response";

// Re-export form response types for backward compatibility
export {
  RateLimitFormResult,
  type FormErrors,
  type FormResponseError,
  type FormResponseSuccess,
  type FormResponseResult,
} from "../lib/response";

/** D1 batch operation result type */
interface D1Result {
  success: boolean;
  results?: unknown[];
  error?: string;
}

// ──────────────────────────────────────────────────────────────
// Service Container
// ──────────────────────────────────────────────────────────────

/**
 * Lazy service accessor for horizontal service access.
 *
 * Provides deferred access to services to avoid circular dependency issues
 * during initialization. Services are resolved only when accessed.
 */
export interface ServiceContainer {
  readonly admin: import("./admin").AdminService;
  readonly auth: import("./auth").AuthService;
  readonly user: import("./user").UserService;
  readonly kit: import("./kit").KitService;
  readonly kitTransfer: import("./kit-transfer").KitTransferService;
}

/**
 * Factory function type for creating service container.
 *
 * Used to defer service resolution until after all services are initialized.
 */
export type ServiceContainerFactory = () => ServiceContainer;

// ──────────────────────────────────────────────────────────────
// Base Service Class
// ──────────────────────────────────────────────────────────────

/**
 * Base service class providing common functionality for all services.
 *
 * Handles error handling, database operations, form responses, and timeouts.
 * All other services extend this class to inherit consistent behavior.
 */
export class BaseService {
  responses = responses;
  getMessage = getMessage;

  private _services: ServiceContainerFactory | null = null;
  protected _env: Env | null = null;
  protected _cache: CacheManager;
  protected _queue: QueueManager;
  protected _totp: TotpManager;
  protected rateLimiter: RateLimiter | null = null;

  constructor(public db: Database) {
    // Initialize with no-op bindings - will be replaced with real ones if available
    const noopKV = {
      get: async () => null,
      getWithMetadata: async () => null,
      put: async () => {},
      delete: async () => {},
      list: async () => ({ keys: [], list_complete: true }),
    } as unknown as KVNamespace<string>;

    const noopQueue = {
      send: async () => {},
      sendBatch: async () => {},
    } as unknown as Queue;

    this._cache = new CacheManager(noopKV);
    this._queue = new QueueManager(noopQueue);
    this._totp = new TotpManager(noopKV);
  }

  // ──────────────────────────────────────────────────────────────
  // Cache & Queue Accessors
  // ──────────────────────────────────────────────────────────────

  /**
   * Public access to cache manager for routes and loaders.
   *
   * @returns CacheManager instance (always available)
   */
  public get cache(): CacheManager {
    return this._cache;
  }

  /**
   * Public access to queue manager for background jobs.
   *
   * @returns QueueManager instance (always available)
   */
  public get queue(): QueueManager {
    return this._queue;
  }

  /**
   * Public access to TOTP manager for two-factor authentication.
   *
   * @returns TotpManager instance (always available)
   */
  public get totp(): TotpManager {
    return this._totp;
  }

  /**
   * Set the service container factory for horizontal service access.
   *
   * Called after all services are initialized to enable cross-service calls.
   * Uses factory pattern to avoid circular dependency issues.
   *
   * @param factory - Function that returns the service container
   */
  public setServices(factory: ServiceContainerFactory): void {
    this._services = factory;
  }

  /**
   * Initialize cache and queue managers from environment bindings.
   *
   * @param env - Cloudflare environment bindings
   */
  public initializeManagers(env: Env): void {
    this._env = env;
    if (env.kv) {
      this._cache = new CacheManager(env.kv);
      this._totp = new TotpManager(env.kv);
      this.rateLimiter = this._cache.rateLimiter;
    }
    if (env.queue) {
      this._queue = new QueueManager(env.queue);
    }
  }

  /**
   * Access Cloudflare environment bindings.
   *
   * Available after initializeManagers() is called by createRouteService.
   */
  protected get env(): Env {
    if (!this._env) {
      throw new Error("Environment not initialized. Ensure route uses createRouteService.");
    }
    return this._env;
  }

  /**
   * Access other services horizontally.
   *
   * Provides lazy access to all services in the container.
   * Throws if services haven't been initialized yet.
   */
  protected get services(): ServiceContainer {
    if (!this._services) {
      throw new Error("Services not initialized. Call setServices() first.");
    }
    return this._services();
  }

  /** Shortcut to auth service */
  protected get auth() {
    return this.services.auth;
  }

  /** Shortcut to user service */
  protected get user() {
    return this.services.user;
  }

  /** Shortcut to kit service */
  protected get kit() {
    return this.services.kit;
  }

  /** Shortcut to kit transfer service */
  protected get kitTransfer() {
    return this.services.kitTransfer;
  }

  /** Shortcut to admin service */
  protected get admin() {
    return this.services.admin;
  }

  /**
   * Access R2 bucket storage.
   *
   * Available after initializeManagers() is called by createRouteService.
   */
  protected get r2(): R2Bucket {
    if (!this._env?.r2) {
      throw new Error(
        "R2 not initialized. Ensure route uses createRouteService with cloudflare context.",
      );
    }
    return this._env.r2;
  }

  /**
   * Simple test method to verify service is working.
   *
   * @returns Test greeting string
   */
  public test() {
    return "Hi!";
  }

  /**
   * Check rate limit for a request.
   *
   * @param request - HTTP request to check
   * @param options - Rate limit configuration
   * @throws Response with 429 status if rate limit exceeded
   */
  public async rateLimit(request: Request, options?: { time?: number }): Promise<void> {
    if (!this.rateLimiter) {
      return;
    }

    const timeInSeconds = options?.time ?? 1;
    const identifier = this.getRateLimitIdentifier(request);
    const path = this.getRateLimitPath(request);

    const limiter = this._cache.createRateLimiter({
      windowMs: timeInSeconds * 1000,
      maxRequests: 1,
    });

    const result = await limiter.checkLimit(identifier, path);

    if (!result.allowed) {
      throw this.responses.getTooManyRequests(
        `Too many requests. Please try again in ${result.retryAfter} second(s).`,
      );
    }
  }

  /**
   * Check rate limit for a form request with Validator-like API.
   *
   * @param request - HTTP request to check
   * @param options - Rate limit configuration
   * @returns RateLimitFormResult with success status and errors
   */
  public async rateLimitForm(
    request: Request,
    options?: { time?: number },
  ): Promise<RateLimitFormResult> {
    if (!this.rateLimiter) {
      return new RateLimitFormResult(true);
    }

    const timeInSeconds = options?.time ?? 1;
    const identifier = this.getRateLimitIdentifier(request);
    const path = this.getRateLimitPath(request);

    const limiter = this._cache.createRateLimiter({
      windowMs: timeInSeconds * 1000,
      maxRequests: 1,
    });

    const result = await limiter.checkLimit(identifier, path);

    if (!result.allowed) {
      return new RateLimitFormResult(false, {
        general: `Too many requests. Please try again in ${result.retryAfter} second(s).`,
      });
    }

    return new RateLimitFormResult(true);
  }

  private getRateLimitIdentifier(request: Request): string {
    return (
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown"
    );
  }

  private getRateLimitPath(request: Request): string {
    const url = new URL(request.url);
    return url.pathname;
  }

  /**
   * Get current UTC timestamp from request.
   *
   * @param request - HTTP request
   * @returns Current UTC timestamp in milliseconds
   */
  public getRequestTime(request: Request): number {
    return Date.now();
  }

  /**
   * Wrap a single database operation with error handling.
   *
   * Catches DB errors and throws a 503 Service Unavailable response.
   * Use for every direct database query. Do NOT nest inside `exDbBatchOperation`.
   *
   * @param operation - Async function containing a single DB query
   * @returns Promise resolving to the query result
   * @throws 503 Service Unavailable response on DB failure
   *
   * @example
   * ```ts
   * const user = await this.exDbOperation(() =>
   *   this.db.op.selectFrom("users").where("user_id", "=", id).executeTakeFirst()
   * );
   * ```
   */
  public async exDbOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error("[Database Error]", error);

      throw this.responses.getInternalError();
    }
  }

  /**
   * Execute multiple database queries as a single D1 batch.
   *
   * Compiles Kysely queries into D1 prepared statements and runs them
   * in one `db.cf.batch()` call. Returns the first row from each result.
   * Do NOT wrap individual queries with `exDbOperation` inside — this
   * method handles its own error catching.
   *
   * @param queries - Array of Kysely compilable queries
   * @returns Promise resolving to array of first rows from each query
   * @throws 500 Internal Error response on batch failure
   *
   * @example
   * ```ts
   * await this.exDbBatchOperation([
   *   this.db.op.insertInto("users").values({ ... }).returningAll(),
   *   this.db.op.insertInto("logins").values({ ... }).returningAll(),
   * ]);
   * ```
   */
  public async exDbBatchOperation<T extends any[]>(queries: Compilable<unknown>[]): Promise<T> {
    try {
      const statements = queries.map((query) => this.prepareQuery(query));
      const batchResults = await this.db.cf.batch(statements);

      const results = batchResults.map((d1Result: D1Result) => d1Result.results?.[0]);

      return results as T;
    } catch (error) {
      console.error("[Batch Error]", error);

      throw this.responses.getInternalError();
    }
  }

  /**
   * Return data directly from service methods.
   *
   * Use inside `@dataMethod` or `@loaderMethod` decorated methods.
   * The route layer wraps the result with `data()` for React Router.
   *
   * @example
   * // In a service method (with decorator)
   * @dataMethod()
   * async getById(id: string) {
   *   const kit = await this.exDbOperation(() =>
   *     this.db.op.selectFrom("kits").where("id", "=", id).executeTakeFirst()
   *   );
   *   if (!kit) return this.none();
   *   return this.ok(kit);
   * }
   *
   * @param data - Data to return
   * @returns The input data unchanged
   */
  public ok<T>(data: T): T {
    return data;
  }

  /**
   * Return null to indicate "no data" from service methods.
   *
   * Use inside `@dataMethod` or `@loaderMethod` decorated methods to signal
   * absence of data without throwing.
   *
   * Use when:
   * - Resource not found (and you want null, not 404)
   * - Optional data is unavailable
   *
   * For errors (not found = 404, unauthorized = 401), use `this.throw()` instead.
   *
   * @example
   * // In a service method
   * @dataMethod()
   * async getOptionalData(id: string) {
   *   const item = await this.exDbOperation(() =>
   *     this.db.op.selectFrom("items").where("id", "=", id).executeTakeFirst()
   *   );
   *   if (!item) return this.none();
   *   return this.ok(item);
   * }
   *
   * @returns Always null
   */
  public none(): null {
    return null;
  }

  /**
   * Return success response for form operations.
   *
   * Use inside `@formMethod` decorated methods. The route layer wraps
   * the result with `data()` for React Router.
   *
   * @param result - Data to wrap in success response
   * @returns `{ success: true, result }`
   */
  public formSuccess<T>(result: T): FormResponseSuccess<T> {
    return {
      success: true,
      result,
    };
  }

  /**
   * Return error response for form operations.
   *
   * Use inside `@formMethod` decorated service methods or route actions.
   * For standalone use, import `formError` from `$/lib/response`.
   *
   * @param errors - Field-specific and/or general error messages
   * @returns `{ success: false, errors }`
   */
  public formError(errors: FormErrors): FormResponseError {
    return {
      success: false,
      errors,
    };
  }

  /**
   * Universal error throwing for all decorators.
   *
   * Usage:
   * - this.throw({ email: "Required" }) → validation error
   * - this.throw(this.responses.getNotFound()) → HTTP error
   *
   * @formMethod behavior:
   *   - { fields } → formError(fields)
   *   - Response → extract message → formError({ general })
   *
   * @dataMethod / @loaderMethod behavior:
   *   - Response → re-throw
   *   - { fields } → throw 400 Bad Request
   */
  public throw(input: FormErrors | Response): never {
    if (input instanceof Response) {
      throw input;
    }
    throw { fields: input };
  }

  /**
   * Convert Kysely query to D1 prepared statement.
   *
   * Handles parameter conversion for D1 compatibility, including
   * Date object conversion to timestamps.
   *
   * @param query - Kysely compilable query
   * @returns D1 prepared statement ready for execution
   */
  protected prepareQuery(query: Compilable<unknown>): D1PreparedStatement {
    const compiled = query.compile();

    // Convert parameters for D1 compatibility
    const parameters = compiled.parameters.map((param) => {
      if (param instanceof Date) {
        return param.getTime(); // Convert Date to timestamp
      }
      if (typeof param === "string") {
        const dateParsed = Date.parse(param);
        if (!isNaN(dateParsed)) {
          return dateParsed; // Convert date strings to timestamps
        }
      }
      return param; // Return unchanged for other types
    });

    return this.db.cf.prepare(compiled.sql).bind(...parameters);
  }
}
