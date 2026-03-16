// ──────────────────────────────────────────────────────────────
// Form Response System
// ──────────────────────────────────────────────────────────────
// Types and helpers for form actions and user submissions.
// Used in route actions and services that handle form data.
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

/** Shared error record type for form field + general errors */
export type FormErrors = Record<string, string> & { general?: string };

/**
 * Form response error with discriminated `success: false` flag.
 *
 * @example
 * ```ts
 * const error: FormResponseError = {
 *   success: false,
 *   errors: { email: "Invalid email", general: "Validation failed" },
 * };
 * ```
 */
export type FormResponseError = {
  success: false;
  errors: FormErrors;
};

/**
 * Form response success with discriminated `success: true` flag.
 *
 * @example
 * ```ts
 * const success: FormResponseSuccess<{ userId: string }> = {
 *   success: true,
 *   result: { userId: "abc-123" },
 * };
 * ```
 */
export type FormResponseSuccess<T = unknown> = {
  success: true;
  result: T;
};

/**
 * Discriminated union for form operation results.
 *
 * Use in service methods that handle form submissions.
 * Check `result.success` to narrow the type.
 *
 * @example
 * ```ts
 * const result: FormResponseResult<{ done: boolean }> = await service.someAction();
 * if (result.success) {
 *   console.log(result.result.done);
 * } else {
 *   console.log(result.errors.general);
 * }
 * ```
 */
export type FormResponseResult<T = unknown> = FormResponseError | FormResponseSuccess<T>;

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Create a form success response.
 *
 * Standalone helper for use outside BaseService (e.g. route actions).
 *
 * @param result - Data to wrap in success response
 * @returns `{ success: true, result }`
 *
 * @example
 * ```ts
 * return data(formSuccess({ userId: "abc-123" }));
 * ```
 */
export function formSuccess<T>(result: T): FormResponseSuccess<T> {
  return { success: true, result };
}

/**
 * Create a form error response.
 *
 * Standalone helper for use outside BaseService (e.g. route actions).
 *
 * @param errors - Field-specific and/or general errors
 * @returns `{ success: false, errors }`
 *
 * @example
 * ```ts
 * return data(formError({ email: "Already taken", general: "Validation failed" }));
 * ```
 */
export function formError(errors: FormErrors): FormResponseError {
  return { success: false, errors };
}

// ──────────────────────────────────────────────────────────────
// Type Guard
// ──────────────────────────────────────────────────────────────

/**
 * Type guard for form response errors.
 *
 * @param value - Unknown value to check
 * @returns `true` when value matches `FormResponseError` shape
 */
export function isFormResponseError(value: unknown): value is FormResponseError {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === false &&
    "errors" in value
  );
}

// ──────────────────────────────────────────────────────────────
// Rate Limit Form Result
// ──────────────────────────────────────────────────────────────

/**
 * Rate limit check result with form-compatible error output.
 *
 * Used by `BaseService.rateLimitForm()` to return rate limit
 * results in a form-friendly format.
 *
 * @example
 * ```ts
 * const rate = await this.rateLimitForm(request);
 * if (rate.isError) return rate.getError();
 * ```
 */
export class RateLimitFormResult {
  constructor(
    public readonly success: boolean,
    public readonly errors?: FormErrors,
  ) {}

  get isSuccess(): boolean {
    return this.success;
  }

  get isError(): boolean {
    return !this.success;
  }

  getError(): FormResponseError {
    return {
      success: false,
      errors: this.errors || { general: "Rate limit exceeded" },
    };
  }

  getErrors(): FormErrors {
    return this.errors || {};
  }
}
