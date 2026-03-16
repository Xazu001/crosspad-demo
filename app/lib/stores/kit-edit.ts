import { createTypedSubmit } from "@/utils/typed-submit";

import { create } from "zustand";

import { toast } from "react-toastify";

import { useSubmitForm } from "#/lib/router/use-submit-form";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface TransferCodeEntry {
  code: string;
  expiresAt: number;
}

export interface KitEditState {
  /** Whether component has mounted on client */
  isClient: boolean;
  /** Set of deleted kit IDs (optimistic deletion) */
  deletedKitIds: Set<number>;
  /** Map of kitId to transfer code data */
  transferCodes: Map<number, TransferCodeEntry>;
  /** Kit ID that just had a code generated (modal should auto-open) */
  justGeneratedKitId: number | null;

  // Actions
  /** Mark component as mounted on client */
  setClient: () => void;
  /** Add a kit ID to deleted set */
  addDeletedKitId: (kitId: number) => void;
  /** Set transfer code for a kit */
  setTransferCode: (kitId: number, entry: TransferCodeEntry) => void;
  /** Remove transfer code by code string */
  removeTransferCodeByCode: (code: string) => void;
  /** Set the just-generated kit ID */
  setJustGeneratedKitId: (kitId: number | null) => void;
  /** Clear the just-generated kit ID */
  clearJustGeneratedKitId: () => void;
  /** Reset all state */
  reset: () => void;
}

// ──────────────────────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────────────────────

const initialState = {
  isClient: false,
  deletedKitIds: new Set<number>(),
  transferCodes: new Map<number, TransferCodeEntry>(),
  justGeneratedKitId: null as number | null,
};

/** Store for managing kit edit page state */
export const useKitEditStore = create<KitEditState>((set) => ({
  ...initialState,

  setClient: () => set({ isClient: true }),

  addDeletedKitId: (kitId) =>
    set((state) => {
      const next = new Set(state.deletedKitIds);
      next.add(kitId);
      return { deletedKitIds: next };
    }),

  setTransferCode: (kitId, entry) =>
    set((state) => {
      const next = new Map(state.transferCodes);
      next.set(kitId, entry);
      return { transferCodes: next };
    }),

  removeTransferCodeByCode: (code) =>
    set((state) => {
      const next = new Map(state.transferCodes);
      for (const [kitId, entry] of next.entries()) {
        if (entry.code === code) {
          next.delete(kitId);
          break;
        }
      }
      return { transferCodes: next };
    }),

  setJustGeneratedKitId: (kitId) => set({ justGeneratedKitId: kitId }),

  clearJustGeneratedKitId: () => set({ justGeneratedKitId: null }),

  reset: () => set(initialState),
}));

// ──────────────────────────────────────────────────────────────
// Form Submission Hook (uses store internally)
// ──────────────────────────────────────────────────────────────

/** Hook that provides form submission handlers with store integration */
export function useKitEditActions() {
  const { addDeletedKitId, setTransferCode, removeTransferCodeByCode, setJustGeneratedKitId } =
    useKitEditStore();

  const {
    submit: submitDelete,
    isSubmitting: isDeleting,
    errors: deleteErrors,
  } = useSubmitForm<{ kitId: number }, { totpCode?: string }>({
    action: "/kit/edit",
    onSuccess: ({ kitId }) => {
      addDeletedKitId(kitId);
    },
  });

  const {
    submit: submitTransfer,
    isSubmitting: isCreatingTransfer,
    errors: transferErrors,
  } = useSubmitForm<{ kitId: number; code: string; expiresAt: number }>({
    action: "/kit/edit",
    onSuccess: ({ kitId, code, expiresAt }) => {
      setTransferCode(kitId, { code, expiresAt });
      setJustGeneratedKitId(kitId);
    },
  });

  const { submit: submitCancelTransfer, isSubmitting: isCancelingTransfer } = useSubmitForm<{
    success: boolean;
  }>({
    action: "/kit/edit",
    onSuccess: () => {
      toast.success("Transfer code cancelled");
    },
  });

  const deleteKit = (kitId: number, totpCode?: string) => {
    submitDelete(
      createTypedSubmit("delete-kit", {
        kitId: String(kitId),
        ...(totpCode && { totpCode }),
      }),
    );
  };

  const createTransferCode = (kitId: number) => {
    submitTransfer(
      createTypedSubmit("create-transfer-code", {
        kitId: String(kitId),
      }),
    );
  };

  const cancelTransfer = (code: string) => {
    submitCancelTransfer(createTypedSubmit("cancel-transfer-code", { code }));
    removeTransferCodeByCode(code);
  };

  return {
    // Delete
    deleteKit,
    isDeleting,
    deleteError: deleteErrors.general,
    // Transfer
    createTransferCode,
    isCreatingTransfer,
    transferError: transferErrors.general,
    // Cancel
    cancelTransfer,
    isCancelingTransfer,
  };
}
