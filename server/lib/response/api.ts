// ──────────────────────────────────────────────────────────────
// API Response System
// ──────────────────────────────────────────────────────────────
// Types and helpers for REST API endpoints (Hono routes).
// Used in server/api/ handlers and consumed by app/lib/admin.
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

/**
 * API success response.
 *
 * @example
 * ```ts
 * const res: ApiSuccess<{ userId: string }> = {
 *   success: true,
 *   result: { userId: "abc-123" },
 * };
 * ```
 */
export type ApiSuccess<T = unknown> = {
  success: true;
  result: T;
};

/**
 * API error response.
 *
 * @example
 * ```ts
 * const res: ApiError = {
 *   success: false,
 *   errors: { general: "User not found" },
 * };
 * ```
 */
export type ApiError = {
  success: false;
  errors: Record<string, string>;
};

/**
 * Discriminated union for API responses.
 *
 * Check `result.success` to narrow the type.
 *
 * @example
 * ```ts
 * const res: ApiResponse<UserData> = await cliFetch("/api/admin/cli/users");
 * if (res.success) {
 *   console.log(res.result);
 * } else {
 *   console.log(res.errors.general);
 * }
 * ```
 */
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Create an API success response object.
 *
 * @param data - Response payload
 * @returns `{ success: true, result: data }`
 */
export function apiSuccess<T>(data: T): ApiSuccess<T> {
  return { success: true, result: data };
}

/**
 * Create an API error response object.
 *
 * @param message - Error message (set as `general` field)
 * @returns `{ success: false, errors: { general: message } }`
 */
export function apiError(message: string): ApiError {
  return { success: false, errors: { general: message } };
}

/**
 * Create an API validation error response object.
 *
 * @param errors - Field-specific error messages
 * @returns `{ success: false, errors }`
 */
export function apiValidationError(errors: Record<string, string>): ApiError {
  return { success: false, errors };
}
