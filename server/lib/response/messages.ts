// ──────────────────────────────────────────────────────────────
// Message Catalog
// ──────────────────────────────────────────────────────────────

/** Standard error and success messages */
export const messages = {
  SOMETHING_WRONG: "Something is wrong",
  NO_ACCESS: "No access",
  UNAUTHORIZED: "Unauthorized",
  RESOURCE_NOT_FOUND: "Resource not found",
  BAD_REQUEST: "Bad request",
  CONFLICT: "Conflict",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  SERVICE_UNAVAILABLE: "Service Unavailable",
  REQUEST_TIMEOUT: "Request took too long. Please try again.",
  VALIDATION_FAILED: "Validation failed",
  ACCESS_GRANTED: "Access granted",
  OPERATION_SUCCESSFUL: "Operation successful",
  RESOURCE_CREATED: "Resource created",
  RESOURCE_UPDATED: "Resource updated",
  RESOURCE_DELETED: "Resource deleted",
} as const;

export type MessageKey = keyof typeof messages;

/**
 * Get a message by key with TypeScript autocomplete.
 *
 * @param key - Message key enum
 * @returns Message string
 */
export function getMessage(key: MessageKey): string {
  return messages[key];
}
