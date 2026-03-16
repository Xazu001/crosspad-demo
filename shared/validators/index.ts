import { z } from "zod";

// ================================================================
// ----------------------- FORM VALIDATION -----------------------
// ================================================================

// ================================================================
// ----------------------- ERROR FORMATTING ----------------------
// ================================================================

/**
 * Processes a Zod error message by replacing placeholder '#' with actual validation values
 */
export function formatZodErrorMessage(message: string, issue: z.ZodIssue): string {
  // If there are no placeholders, return the original message
  if (!message.includes("#")) return message;

  let formattedMessage = message;

  // Get validation parameters based on the issue type
  if (issue.code === "too_small") {
    // For min length/value validations
    if ("minimum" in issue) {
      const minimum = (issue as any).minimum;
      if (minimum !== undefined) {
        formattedMessage = formattedMessage.replace(/#/g, minimum.toString());
      }
    }
  } else if (issue.code === "too_big") {
    // For max length/value validations
    if ("maximum" in issue) {
      const maximum = (issue as any).maximum;
      if (maximum !== undefined) {
        formattedMessage = formattedMessage.replace(/#/g, maximum.toString());
      }
    }
  } else if (issue.code === "invalid_type") {
    // For type validations
    if ("expected" in issue && "received" in issue) {
      const expected = (issue as any).expected;
      const received = (issue as any).received;

      // Special handling for required fields
      if (received === "undefined" && message === "Required") {
        // Use a custom message for required fields based on the field name
        const fieldName = issue.path[0];
        if (typeof fieldName === "string") {
          // Convert field name to a more readable format
          const readableFieldName = fieldName
            .toString()
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .trim();

          return `${readableFieldName} is required`;
        }
      }

      if (expected !== undefined) {
        formattedMessage = formattedMessage.replace(/#/g, expected);
      }
    }
  } else if (issue.code === "custom") {
    // For custom validations, try to extract values from params if available
    const params = (issue as any).params;
    if (params && typeof params === "object") {
      if ("minimum" in params) {
        formattedMessage = formattedMessage.replace(/#/g, params.minimum.toString());
      } else if ("maximum" in params) {
        formattedMessage = formattedMessage.replace(/#/g, params.maximum.toString());
      } else if ("length" in params) {
        formattedMessage = formattedMessage.replace(/#/g, params.length.toString());
      }
    }
  }

  return formattedMessage;
}

/**
 * Type for validation result with structured errors
 */
export type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: Partial<{ [K in keyof T]: string }>;
    };

/**
 * Extracts form data from a Request and converts it to a plain object
 */
export async function extractFormData(request: Request): Promise<Record<string, any>> {
  const formData = await request.formData();
  const result: Record<string, any> = {};
  formData.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Validates data using a Zod schema and returns structured errors
 */
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: any): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const formattedErrors = {} as Partial<{ [K in keyof T]: string }>;

    // Process each error and map it to the appropriate field
    result.error.issues.forEach((issue) => {
      const fieldName = issue.path[0];
      if (fieldName && typeof fieldName === "string") {
        // Format the error message by replacing placeholders with actual values
        formattedErrors[fieldName as keyof T] = formatZodErrorMessage(issue.message, issue);
      }
    });

    return { success: false, errors: formattedErrors };
  }

  return { success: true, data: result.data };
}

/**
 * Validates data against a Zod schema and returns a mutable result
 */
export function validateData<T>(data: any, schema: z.ZodSchema<T>): MutableValidationResult<T> {
  const result = schema.safeParse(data);

  // Extract errors if validation failed
  const validationErrors = result.success
    ? {}
    : result.error.issues.reduce(
        (acc, issue) => {
          const fieldName = issue.path[0];
          if (fieldName && typeof fieldName === "string") {
            acc[fieldName as keyof T] = formatZodErrorMessage(issue.message, issue);
          }
          return acc;
        },
        {} as Partial<{ [K in keyof T]: string }>,
      );

  // Return a new instance of MutableValidationResult
  return new MutableValidationResult(
    result.success,
    result.success ? result.data : undefined,
    validationErrors,
  );
}

/**
 * Validation helper class - all validation methods in one place
 */
export class Validator {
  /**
   * Check if validation succeeded
   */
  static isSuccess<T>(
    result: MutableValidationResult<T>,
  ): result is MutableValidationResult<T> & { success: true; data: T } {
    return result.success;
  }

  /**
   * Check if validation failed
   */
  static isError<T>(result: MutableValidationResult<T>): result is MutableValidationResult<T> & {
    success: false;
    errors: NonNullable<MutableValidationResult<T>["errors"]>;
  } {
    return !result.success;
  }

  /**
   * Get validation errors safely (returns empty object if no errors)
   */
  static getErrors<T>(
    result: MutableValidationResult<T>,
  ): Record<string, string> & { general?: string } {
    return result.errors || {};
  }

  /**
   * Validate form request with schema
   */
  static async validateForm<T>(
    request: Request,
    schema: z.ZodSchema<T>,
  ): Promise<MutableValidationResult<T>> {
    const formData = await extractFormData(request);
    return validateData(formData, schema);
  }

  /**
   * Validate pre-parsed data with schema
   */
  static validateData<T>(data: any, schema: z.ZodSchema<T>): MutableValidationResult<T> {
    return validateData(data, schema);
  }
}

/**
 * MutableValidationResult class for mutable validation results
 */
class MutableValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: {
    general?: string;
  } & Partial<{ [K in keyof T]: string }>;

  constructor(
    success: boolean,
    data?: T,
    errors?: {
      general?: string;
    } & Partial<{ [K in keyof T]: string }>,
  ) {
    this.success = success;
    this.data = data;
    this.errors = errors;
  }

  /**
   * Completely overwrite all errors
   */
  setErrors(newErrors: { general?: string } & Partial<{ [K in keyof T]: string }>): this {
    this.errors = newErrors;
    this.success = false;
    return this;
  }

  /**
   * Add new errors to existing ones
   */
  addErrors(newErrors: { general?: string } & Partial<{ [K in keyof T]: string }>): this {
    this.errors = { ...this.errors, ...newErrors };
    this.success = false;
    return this;
  }
}

/**
 * Complete form validation pipeline: extract form data and validate with schema
 */
export async function validateFormRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<MutableValidationResult<T>> {
  const formData = await extractFormData(request);
  return validateData(formData, schema);
}

export { z, MutableValidationResult };
