// ──────────────────────────────────────────────────────────────
// CLI API Communication Utilities
// ──────────────────────────────────────────────────────────────
// Universal utilities for CLI handlers to communicate with the API.
// ──────────────────────────────────────────────────────────────
import type { ApiResponse } from "$/lib/response";

export type { ApiResponse } from "$/lib/response";

/**
 * Fetch wrapper for admin CLI API calls with proper error handling.
 *
 * @param path - API path (e.g., "/api/admin/cli/users/123")
 * @param options - Fetch options
 * @returns Parsed API response
 */
export async function cliFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = (await response.json()) as ApiResponse<T>;

    if (!response.ok) {
      return {
        success: false,
        errors: ("errors" in data ? data.errors : { general: "Request failed" }) as Record<
          string,
          string
        >,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      errors: {
        general: error instanceof Error ? error.message : "Network error",
      },
    };
  }
}
