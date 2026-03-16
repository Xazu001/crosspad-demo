// ──────────────────────────────────────────────────────────────
// Form Submission Hook
// ──────────────────────────────────────────────────────────────
import type { FormResponseResult } from "$/services/base";

import { useCallback, useEffect, useRef, useState } from "react";

import { useFetcher, useNavigate } from "react-router";

/**
 * Configuration options for useSubmitForm hook
 * @template TData - Type of successful response data
 * @template TInputs - Type of form inputs for error mapping
 */
export type UseSubmitFormOptions<TData = any, TInputs = any> = {
  // Submission options
  fetcher?: ReturnType<typeof useFetcher<FormResponseResult<TData>>>;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  action?: string;
  encType?: "application/x-www-form-urlencoded" | "multipart/form-data";
  replace?: boolean;
  preventMultiple?: boolean;
  resetAfterSubmit?: boolean;
  resetDelay?: number;

  // Response handlers
  onSuccess?: (result: TData) => void | Promise<void>;
  onError?: (
    errors: Partial<Record<keyof TInputs, string>> & { general?: string },
  ) => void | Promise<void>;
  onFinally?: () => void;

  // Navigation options
  navigateTo?: string;
  navigateOptions?: { replace?: boolean; state?: any };

  // Reset options
  resetOnSuccess?: boolean;
  resetOnError?: boolean;
};

/**
 * Return type for useSubmitForm hook
 * @template TData - Type of successful response data
 * @template TInputs - Type of form inputs for error mapping
 */
export type UseSubmitFormReturn<TData = any, TInputs = any> = {
  submit: (
    data: FormData | Record<string, any>,
    options?: Partial<UseSubmitFormOptions<TData, TInputs>>,
  ) => void;
  isSubmitting: boolean;
  errors: Partial<Record<keyof TInputs, string>> & { general?: string };
  result: TData | null;
  success: boolean;
  reset: () => void;
  fetcher: ReturnType<typeof useFetcher<FormResponseResult<TData>>>;
};

/**
 * Unified hook for handling form submissions with React Router fetcher
 * Combines submission logic, response handling, and navigation in one place
 */
export function useSubmitForm<TData = any, TInputs = any>(
  options: UseSubmitFormOptions<TData, TInputs> = {},
): UseSubmitFormReturn<TData, TInputs> {
  const {
    fetcher: externalFetcher,
    method = "POST",
    action,
    encType,
    replace = false,
    preventMultiple = true,
    resetAfterSubmit = true,
    resetDelay = 100,
    onSuccess,
    onError,
    onFinally,
    navigateTo,
    navigateOptions,
    resetOnSuccess = false,
    resetOnError = false,
  } = options;

  // Use external fetcher if provided, otherwise create a new one
  const internalFetcher = useFetcher<FormResponseResult<TData>>();
  const fetcher = externalFetcher || internalFetcher;
  const navigate = useNavigate();

  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof TInputs, string>> & { general?: string }
  >({});
  const [result, setResult] = useState<TData | null>(null);
  const [success, setSuccess] = useState(false);

  // Refs to prevent multiple submissions and track previous data
  const isSubmittingRef = useRef(false);
  const timeoutRef = useRef<number | undefined>(undefined);
  const previousDataRef = useRef<FormResponseResult<TData> | undefined>(undefined);
  const isProcessingRef = useRef<boolean>(false);

  // Handle form submission
  const submit = useCallback(
    (
      data: FormData | Record<string, any>,
      submitOptions: Partial<UseSubmitFormOptions<TData, TInputs>> = {},
    ) => {
      // Prevent multiple submissions if enabled
      if (preventMultiple && (isSubmittingRef.current || fetcher.state === "submitting")) {
        return;
      }

      // Convert plain object to FormData if needed
      const formData =
        data instanceof FormData
          ? data
          : (() => {
              const fd = new FormData();
              Object.entries(data).forEach(([key, value]) => {
                // Skip null and undefined values
                if (value !== null && value !== undefined) {
                  fd.append(key, String(value));
                }
              });
              return fd;
            })();

      // Update submission state
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setErrors({});
      setResult(null);
      setSuccess(false);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Submit the form
      fetcher.submit(formData, {
        method: (submitOptions.method || method) as any,
        action: submitOptions.action || action,
        encType: (submitOptions.encType || encType) as any,
      });

      // Set up auto-reset if requested
      if (resetAfterSubmit) {
        timeoutRef.current = setTimeout(() => {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }, resetDelay) as any;
      }
    },
    [fetcher, method, action, encType, replace, preventMultiple, resetAfterSubmit, resetDelay],
  );

  // Handle response changes
  useEffect(() => {
    // Skip if no data
    if (!fetcher.data) {
      previousDataRef.current = undefined;
      return;
    }

    // Skip if data hasn't changed
    if (fetcher.data === previousDataRef.current) {
      return;
    }

    // Skip if already processing
    if (isProcessingRef.current) {
      return;
    }

    // Mark as processing
    isProcessingRef.current = true;

    // Process the response directly - fetcher.data should already be the result from action
    const processResponse = async () => {
      try {
        if (fetcher.data?.success) {
          // Handle success response
          setResult(fetcher.data.result || null);
          setSuccess(true);
          setErrors({});

          // Call success handler if provided
          if (onSuccess && fetcher.data.result) {
            await onSuccess(fetcher.data.result);
          }

          // Handle navigation if specified
          if (navigateTo) {
            navigate(navigateTo, { replace: true, ...navigateOptions });
          }
        } else if (!fetcher.data?.success && fetcher.data?.errors) {
          // Handle error response
          setErrors(
            fetcher.data.errors as Partial<Record<keyof TInputs, string>> & {
              general?: string;
            },
          );
          setResult(null);
          setSuccess(false);

          // Call error handler if provided
          if (onError) {
            await onError(
              fetcher.data.errors as Partial<Record<keyof TInputs, string>> & {
                general?: string;
              },
            );
          }
        }
      } catch (error) {
        console.error("Error in form response handler:", error);
      } finally {
        // Always run finally handler
        if (onFinally) {
          await onFinally();
        }

        // Update previous data ref
        previousDataRef.current = fetcher.data;

        // Reset processing flag after a short delay
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 10);

        // Reset submission state if not auto-resetting
        if (!resetAfterSubmit) {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }
      }
    };

    processResponse();
  }, [fetcher.data, onSuccess, onError, onFinally, navigateTo, navigateOptions, resetAfterSubmit]);

  // Reset function
  const reset = useCallback(() => {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    setErrors({});
    setResult(null);
    setSuccess(false);
    previousDataRef.current = undefined;
    isProcessingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    submit,
    isSubmitting,
    errors,
    result,
    success,
    reset,
    fetcher,
  };
}
