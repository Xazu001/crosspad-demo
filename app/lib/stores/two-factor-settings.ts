import { createTypedSubmit } from "@/utils/typed-submit";

import { create } from "zustand";

import { toast } from "react-toastify";

import { useSubmitForm } from "#/lib/router/use-submit-form";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface TwoFactorSetupData {
  secret: string;
  backupCodes: string[];
  otpauthUrl: string;
}

export interface TwoFactorSettingsState {
  /** 2FA Setup Modal state */
  showSetupModal: boolean;
  /** Setup data (secret, backup codes, otpauthUrl) */
  setupData: TwoFactorSetupData | null;
  /** Delete Account Modal state */
  showDeleteModal: boolean;
  /** 2FA Disable Modal state */
  showDisableModal: boolean;
  /** TOTP code for delete/disable modals */
  totpCode: string;
  /** TOTP error for delete/disable modals */
  totpError: string | null;
  /** Kit transfer code input */
  transferCode: string;

  // Actions
  setShowSetupModal: (show: boolean) => void;
  setSetupData: (data: TwoFactorSetupData | null) => void;
  setShowDeleteModal: (show: boolean) => void;
  setShowDisableModal: (show: boolean) => void;
  setTotpCode: (code: string) => void;
  setTotpError: (error: string | null) => void;
  setTransferCode: (code: string) => void;
  /** Reset delete modal state */
  resetDeleteModal: () => void;
  /** Reset disable modal state */
  resetDisableModal: () => void;
  /** Reset all 2FA settings state */
  reset: () => void;
}

// ──────────────────────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────────────────────

const initialState = {
  showSetupModal: false,
  setupData: null,
  showDeleteModal: false,
  showDisableModal: false,
  totpCode: "",
  totpError: null,
  transferCode: "",
};

/** Store for managing 2FA settings page state */
export const useTwoFactorSettingsStore = create<TwoFactorSettingsState>((set) => ({
  ...initialState,

  setShowSetupModal: (show) => set({ showSetupModal: show }),
  setSetupData: (data) => set({ setupData: data }),
  setShowDeleteModal: (show) => set({ showDeleteModal: show }),
  setShowDisableModal: (show) => set({ showDisableModal: show }),
  setTotpCode: (code) => set({ totpCode: code, totpError: null }),
  setTotpError: (error) => set({ totpError: error }),
  setTransferCode: (code) => set({ transferCode: code }),

  resetDeleteModal: () => set({ totpCode: "", totpError: null }),
  resetDisableModal: () => set({ totpCode: "", totpError: null }),
  reset: () => set(initialState),
}));

export { useTotpModalStore, useTotpAction } from "./totp-modal-store";

/** Hook that provides form submission handlers with store integration */
export function useSettingsActions() {
  const { setSetupData, setShowSetupModal, setTransferCode } = useTwoFactorSettingsStore();

  // Anonymization form
  const { submit: submitAnonymization, isSubmitting: isAnonymizationSubmitting } =
    useSubmitForm<boolean>({
      action: "/profile/settings",
      resetOnSuccess: true,
      onSuccess: () => {
        toast.success(
          "Account deletion request submitted. Check your email for the undo link. Your account will be anonymized in 24 days.",
        );
      },
      onError: (errors) => {
        if (errors?.general) {
          toast.error(errors.general);
        }
      },
    });

  // TOTP toggle form
  const { submit: submitTotp, isSubmitting: isTotpSubmitting } = useSubmitForm<{
    secret?: string;
    backupCodes?: string[];
    otpauthUrl?: string;
  }>({
    action: "/profile/settings",
    resetOnSuccess: true,
    onSuccess: (result) => {
      if (result.secret && result.backupCodes && result.otpauthUrl) {
        setSetupData({
          secret: result.secret,
          backupCodes: result.backupCodes,
          otpauthUrl: result.otpauthUrl,
        });
        setShowSetupModal(true);
      } else {
        toast.success("Two-factor authentication disabled.");
      }
    },
    onError: (errors) => {
      if (errors?.general) {
        toast.error(errors.general);
      }
    },
  });

  // Kit transfer form
  const {
    submit: submitTransfer,
    isSubmitting: isTransferSubmitting,
    errors: transferErrors,
  } = useSubmitForm<{ kitId: number; kitName: string }>({
    action: "/profile/settings",
    resetOnSuccess: true,
    onSuccess: ({ kitName }) => {
      toast.success(`Kit "${kitName}" transferred successfully!`);
      setTransferCode("");
    },
    onError: (errors) => {
      if (errors?.general) {
        toast.error(errors.general);
      }
    },
  });

  const requestAnonymization = (totpCode?: string) => {
    submitAnonymization(createTypedSubmit("request-anonymization", { totpCode }), {
      method: "POST",
    });
  };

  const prepareTotp = () => {
    submitTotp(createTypedSubmit("prepare-totp"), { method: "POST" });
  };

  const disableTotp = (code: string) => {
    submitTotp(createTypedSubmit("disable-totp", { totpCode: code }), {
      method: "POST",
    });
  };

  const acceptTransfer = (code: string) => {
    if (!code.trim()) {
      toast.error("Please enter a transfer code");
      return;
    }
    submitTransfer(createTypedSubmit("accept-kit-transfer", { code: code.trim() }), {
      method: "POST",
    });
  };

  return {
    // Anonymization
    requestAnonymization,
    isAnonymizationSubmitting,
    // TOTP
    prepareTotp,
    disableTotp,
    isTotpSubmitting,
    // Transfer
    acceptTransfer,
    isTransferSubmitting,
    transferErrors,
  };
}
