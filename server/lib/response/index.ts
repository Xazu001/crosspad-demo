// ──────────────────────────────────────────────────────────────
// Response Module
// ──────────────────────────────────────────────────────────────

// Form Response System (form actions, user submissions)
export { formSuccess, formError, isFormResponseError, RateLimitFormResult } from "./form";
export type {
  FormErrors,
  FormResponseError,
  FormResponseSuccess,
  FormResponseResult,
} from "./form";

// API Response System (REST API endpoints)
export { apiSuccess, apiError, apiValidationError } from "./api";
export type { ApiSuccess, ApiError, ApiResponse } from "./api";

// HTTP Response Helpers (raw Response constructors)
export { responses } from "./http";

// Message Catalog
export { messages, getMessage } from "./messages";
export type { MessageKey } from "./messages";
