// ──────────────────────────────────────────────────────────────
// Service Method Decorators
// ──────────────────────────────────────────────────────────────
// Decorators for service methods that provide automatic error
// handling based on method type (form, data, loader).
// ──────────────────────────────────────────────────────────────
import { formError } from "$/lib/response";
import type { FormErrors } from "$/lib/response";

// ──────────────────────────────────────────────────────────────
// @formMethod - Action-oriented methods
// ──────────────────────────────────────────────────────────────

/**
 * Decorator for form/action methods.
 *
 * - Returns method result AS-IS (no auto-wrap)
 * - Manually call this.formSuccess() / this.formError()
 *
 * Error handling (in order of priority):
 * 1. this.throw({ fields }) → formError(fields)
 * 2. this.throw(Response) → extract message → formError
 * 3. Unexpected error → formError(defaultError)
 *
 * @param defaultError - Optional default error message override
 *
 * @example
 * ```ts
 * @formMethod({ general: "Login failed" })
 * async loginUser(request: Request) {
 *   const login = await this.exDbOperation(() => ...);
 *   if (!login) this.throw({ general: "User not found" });
 *   return this.formSuccess({ token });
 * }
 * ```
 */
export function formMethod(defaultError?: FormErrors) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>,
  ) {
    const originalMethod = descriptor.value!;
    const defaultErr = defaultError ?? { general: "Operation failed" };

    descriptor.value = async function (this: any, ...args: any[]) {
      try {
        // NO AUTO-WRAP — return method result AS-IS
        return await originalMethod.apply(this, args);
      } catch (error) {
        // 1. { fields } → formError(fields)
        if (error && typeof error === "object" && "fields" in error) {
          return formError((error as { fields: FormErrors }).fields);
        }

        // 2. Response → extract message → formError({ general })
        if (error instanceof Response) {
          const message = await extractResponseMessage(error);
          return formError({ general: message });
        }

        // 3. Other → formError(default)
        console.error(`[formMethod] ${propertyKey}:`, error);
        return formError(defaultErr);
      }
    };

    return descriptor;
  };
}

/**
 * Extract message from Response for formError.
 * Tries to parse JSON body, falls back to statusText.
 */
async function extractResponseMessage(response: Response): Promise<string> {
  try {
    const body = (await response.clone().json()) as Record<string, unknown>;
    return (
      (body?.message as string) ||
      (body?.error as string) ||
      response.statusText ||
      "Request failed"
    );
  } catch {
    return response.statusText || "Request failed";
  }
}

// ──────────────────────────────────────────────────────────────
// @dataMethod - Universal methods (loaders/actions)
// ──────────────────────────────────────────────────────────────

/**
 * Decorator for universal data methods.
 *
 * - Re-throws HTTP errors (Response) for React Router to handle
 * - Catches other errors → throws internal HTTP error
 * - Returns result as-is (use ok/none pattern)
 *
 * @example
 * ```ts
 * @dataMethod()
 * async getUserById(userId: string) {
 *   const user = await this.exDbOperation(() => ...);
 *   if (!user) return this.none();
 *   return this.ok(user);
 * }
 * ```
 */
export function dataMethod() {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>,
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (this: any, ...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // 1. Response → re-throw
        if (error instanceof Response) {
          throw error;
        }

        // 2. { fields } → 400 Bad Request
        if (error && typeof error === "object" && "fields" in error) {
          throw this.responses.getBadRequest(
            JSON.stringify((error as { fields: FormErrors }).fields),
          );
        }

        // 3. Other → internal error
        console.error(`[dataMethod] ${propertyKey}:`, error);
        throw this.responses.getInternalError();
      }
    };

    return descriptor;
  };
}

// ──────────────────────────────────────────────────────────────
// @loaderMethod - Loader-only methods
// ──────────────────────────────────────────────────────────────

/**
 * Decorator for loader-only methods.
 * Same behavior as @dataMethod but explicitly signals loader intent.
 *
 * @example
 * ```ts
 * @loaderMethod()
 * async getCategories() {
 *   const categories = await this.exDbOperation(() => ...);
 *   return this.ok(categories);
 * }
 * ```
 */
export function loaderMethod() {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>,
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (this: any, ...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof Response) {
          throw error;
        }

        if (error && typeof error === "object" && "fields" in error) {
          throw this.responses.getBadRequest(
            JSON.stringify((error as { fields: FormErrors }).fields),
          );
        }

        console.error(`[loaderMethod] ${propertyKey}:`, error);
        throw this.responses.getInternalError();
      }
    };

    return descriptor;
  };
}
