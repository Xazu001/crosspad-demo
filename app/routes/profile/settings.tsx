import { createTypedSubmit } from "@/utils/typed-submit";

import * as React from "react";

import { useFetcher, useRevalidator } from "react-router";

import { toast } from "react-toastify";

import { TotpModalContent } from "#/components/custom/totp-modal";
import { TwoFactorSetupModal } from "#/components/custom/two-factor-setup-modal";
import { Modal } from "#/components/ui/modal";
import {
  useSettingsActions,
  useTotpModalStore,
  useTwoFactorSettingsStore,
} from "#/lib/stores/two-factor-settings";

import type { Route } from "./+types/settings";
import { DeleteAccountModal } from "./settings.delete-modal";
import { DeleteAccountSection } from "./settings.delete-section";
import { KitTransferSection } from "./settings.kit-transfer";
import { action, loader } from "./settings.server";
import { TwoFactorSection } from "./settings.two-factor";

// Re-export for React Router route discovery
export { loader, action };

// ──────────────────────────────────────────────────────────────

/** Profile settings page */
export default function Index({ loaderData }: Route.ComponentProps) {
  const { totpEnabled } = loaderData;
  const revalidator = useRevalidator();

  // TOTP verification fetcher (for setup modal)
  const totpFetcher = useFetcher();

  // Verification promise resolver (set by handleVerifyCode, resolved by useEffect)
  const verifyResolveRef = React.useRef<((success: boolean) => void) | null>(null);

  React.useEffect(() => {
    if (verifyResolveRef.current && totpFetcher.state === "idle" && totpFetcher.data) {
      verifyResolveRef.current(totpFetcher.data.success ?? false);
      verifyResolveRef.current = null;
    }
  }, [totpFetcher.data, totpFetcher.state]);

  // 2FA Settings Store
  const {
    showDeleteModal,
    showDisableModal,
    totpCode,
    totpError,
    transferCode,
    setSetupData,
    setShowSetupModal,
    setShowDeleteModal,
    setShowDisableModal,
    setTotpCode,
    setTotpError,
    setTransferCode,
    resetDeleteModal,
    resetDisableModal,
  } = useTwoFactorSettingsStore();

  // TOTP Modal Store (for disable modal)
  const {
    isOpen: isDisableModalOpen,
    totpCode: disableTotpCode,
    error: disableTotpError,
    isLoading: isDisableLoading,
    setTotpCode: setDisableTotpCode,
    setError: setDisableError,
    setIsLoading: setDisableLoading,
    close: closeDisableModal,
  } = useTotpModalStore();

  // Form Actions
  const {
    requestAnonymization,
    isAnonymizationSubmitting,
    prepareTotp,
    disableTotp,
    isTotpSubmitting,
    acceptTransfer,
    isTransferSubmitting,
    transferErrors,
  } = useSettingsActions();

  const handleDeleteClick = () => {
    resetDeleteModal();
    setShowDeleteModal(true);
  };

  const handleTotpToggle = (checked: boolean) => {
    if (checked) {
      prepareTotp();
    } else {
      // Open TOTP modal store for disable confirmation
      useTotpModalStore.getState().open();
    }
  };

  const handleDisableTotp = (code?: string) => {
    if (code) {
      setDisableLoading(true);
      disableTotp(code);
    }
  };

  const handleVerifyCode = async (code: string): Promise<boolean> => {
    return new Promise((resolve) => {
      verifyResolveRef.current = resolve;
      totpFetcher.submit(createTypedSubmit("confirm-enable-totp", { code }), {
        method: "POST",
        action: "/profile/settings",
      });
    });
  };

  const handleSetupComplete = () => {
    toast.success("Two-factor authentication enabled! Save your backup codes in a safe place.");
    setSetupData(null);
    revalidator.revalidate();
  };

  const handleAcceptTransfer = () => {
    acceptTransfer(transferCode);
    revalidator.revalidate();
  };

  return (
    <div className="profile__content-settings">
      <h1>Settings</h1>

      {/* Two-Factor Authentication */}
      <TwoFactorSection
        totpEnabled={totpEnabled}
        onToggle={handleTotpToggle}
        isSubmitting={isTotpSubmitting}
      />

      {/* Accept Kit Transfer */}
      <KitTransferSection
        transferCode={transferCode}
        setTransferCode={setTransferCode}
        onAccept={handleAcceptTransfer}
        isSubmitting={isTransferSubmitting}
        error={transferErrors?.general}
      />

      {/* 2FA Setup Modal - uses Zustand store internally */}
      <TwoFactorSetupModal onVerify={handleVerifyCode} onComplete={handleSetupComplete} />

      {/* Delete Account */}
      <DeleteAccountSection
        onDeleteClick={handleDeleteClick}
        isSubmitting={isAnonymizationSubmitting}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        totpEnabled={totpEnabled}
        totpCode={totpCode}
        totpError={totpError}
        setTotpCode={setTotpCode}
        setTotpError={setTotpError}
        onConfirm={requestAnonymization}
        isSubmitting={isAnonymizationSubmitting}
      />

      {/* 2FA Disable Modal */}
      <Modal open={isDisableModalOpen} onOpenChange={(open) => !open && closeDisableModal()}>
        <TotpModalContent
          title="Disable Two-Factor Authentication"
          message="Are you sure you want to disable 2FA? This will make your account less secure."
          totpEnabled={totpEnabled}
          onConfirm={handleDisableTotp}
          isLoading={isDisableLoading}
          error={disableTotpError ?? undefined}
          totpCode={disableTotpCode}
          onTotpCodeChange={setDisableTotpCode}
          showCancel
          onCancel={closeDisableModal}
          confirmVariant="destructive"
          confirmText="Disable 2FA"
          confirmLoadingText="Disabling..."
        />
      </Modal>
    </div>
  );
}
