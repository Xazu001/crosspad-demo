import { create } from "zustand";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface TotpModalState {
  /** Whether the TOTP modal is open */
  isOpen: boolean;
  /** Current TOTP code input */
  totpCode: string;
  /** Error message to display */
  error: string | null;
  /** Whether the action is in progress */
  isLoading: boolean;

  // Actions
  /** Open the modal */
  open: () => void;
  /** Close the modal and reset state */
  close: () => void;
  /** Set the TOTP code */
  setTotpCode: (code: string) => void;
  /** Set the error message */
  setError: (error: string | null) => void;
  /** Set loading state */
  setIsLoading: (loading: boolean) => void;
  /** Reset all state */
  reset: () => void;
}

// ──────────────────────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────────────────────

const initialState = {
  isOpen: false,
  totpCode: "",
  error: null,
  isLoading: false,
};

/**
 * Generic store for managing TOTP modal state.
 * Can be used for any action that requires TOTP verification.
 */
export const useTotpModalStore = create<TotpModalState>((set) => ({
  ...initialState,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, totpCode: "", error: null }),
  setTotpCode: (code) => set({ totpCode: code.replace(/\D/g, "").slice(0, 6), error: null }),
  setError: (error) => set({ error }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  reset: () => set(initialState),
}));

// ──────────────────────────────────────────────────────────────
// Hook for TOTP Actions
// ──────────────────────────────────────────────────────────────

/**
 * Hook that provides a convenient interface for TOTP-protected actions.
 * Handles the modal state and calls the action with the TOTP code.
 */
export function useTotpAction() {
  const { isOpen, totpCode, error, isLoading, open, close, setTotpCode, setError, setIsLoading } =
    useTotpModalStore();

  /**
   * Execute a TOTP-protected action.
   * Opens the modal, waits for user input, and calls the action.
   */
  const execute = async (
    action: (totpCode: string) => Promise<void>,
    options?: {
      onSuccess?: () => void;
      onError?: (error: string) => void;
    },
  ) => {
    if (!totpCode || totpCode.length !== 6) {
      setError("Enter 6-digit code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await action(totpCode);
      close();
      options?.onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      setError(message);
      options?.onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isOpen,
    totpCode,
    error,
    isLoading,
    open,
    close,
    setTotpCode,
    setError,
    setIsLoading,
    execute,
  };
}
