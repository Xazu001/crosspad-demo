/**
 * Typed submit utilities for React Router actions
 *
 * Enables multiple submit handlers in a single route action by
 * differentiating them based on a "type" field.
 *
 * @example
 * // In component:
 * const submit = useSubmit();
 * submit(createTypedSubmit("anonymization", { userId: "123" }), { method: "POST" });
 *
 * // In action:
 * const { type, data } = await parseTypedSubmit(request);
 * if (type === "anonymization") { ... }
 */

/** Reserved key for the submit type identifier */
export const SUBMIT_TYPE_KEY = "_type";

/** Type-safe submit payload structure */
export interface TypedSubmitPayload<T extends string = string> {
  [SUBMIT_TYPE_KEY]: T;
  [key: string]: unknown;
}

/**
 * Create a typed submit value for use with React Router's submit/fetcher
 *
 * @param type - Action type identifier (e.g., "anonymization", "update-profile")
 * @param data - Optional data payload to include
 * @returns FormData with type and data fields
 *
 * @example
 * // Simple type-only submit
 * submit(createTypedSubmit("delete-account"), { method: "POST" });
 *
 * // With data payload
 * submit(createTypedSubmit("update-settings", { theme: "dark" }), { method: "POST" });
 */
export function createTypedSubmit<T extends string>(
  type: T,
  data?: Record<string, unknown>,
): FormData {
  const formData = new FormData();
  formData.append(SUBMIT_TYPE_KEY, type);

  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
  }

  return formData;
}

/** Parsed result from a typed submit */
export interface ParsedTypedSubmit<T extends string = string> {
  type: T;
  data: Record<string, string | File>;
  formData: FormData;
}

/**
 * Parse a typed submit from a Request
 *
 * @param request - The incoming Request object
 * @returns Parsed type and data, or null if no type found
 *
 * @example
 * export async function action({ request }: Route.ActionArgs) {
 *   const result = await parseTypedSubmit(request);
 *   if (!result) return json({ error: "Invalid submit" }, 400);
 *
 *   switch (result.type) {
 *     case "anonymization":
 *       return handleAnonymization(result.data);
 *     case "update-profile":
 *       return handleUpdateProfile(result.data);
 *     default:
 *       return json({ error: "Unknown action type" }, 400);
 *   }
 * }
 */
export async function parseTypedSubmit<T extends string = string>(
  request: Request,
): Promise<ParsedTypedSubmit<T> | null> {
  const formData = await request.formData();
  const type = formData.get(SUBMIT_TYPE_KEY);

  if (typeof type !== "string") {
    return null;
  }

  const data: Record<string, string | File> = {};
  for (const [key, value] of formData.entries()) {
    if (key !== SUBMIT_TYPE_KEY) {
      data[key] = value;
    }
  }

  return {
    type: type as T,
    data,
    formData,
  };
}

/**
 * Parse a typed submit from existing FormData
 *
 * @param formData - The FormData object
 * @returns Parsed type and data, or null if no type found
 */
export function parseTypedSubmitFromFormData<T extends string = string>(
  formData: FormData,
): ParsedTypedSubmit<T> | null {
  const type = formData.get(SUBMIT_TYPE_KEY);

  if (typeof type !== "string") {
    return null;
  }

  const data: Record<string, string | File> = {};
  for (const [key, value] of formData.entries()) {
    if (key !== SUBMIT_TYPE_KEY) {
      data[key] = value;
    }
  }

  return {
    type: type as T,
    data,
    formData,
  };
}

/**
 * Type guard to check if a submit matches a specific type
 *
 * @example
 * const result = await parseTypedSubmit(request);
 * if (isSubmitType(result, "anonymization")) {
 *   // result.type is now narrowed to "anonymization"
 * }
 */
export function isSubmitType<T extends string>(
  result: ParsedTypedSubmit | null,
  type: T,
): result is ParsedTypedSubmit<T> {
  return result !== null && result.type === type;
}
