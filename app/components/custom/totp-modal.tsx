import "./totp-modal.style.scss";

import * as React from "react";

import { Button, type ButtonProps } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Modal, ModalContent, ModalTrigger } from "#/components/ui/modal";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface TotpModalProps {
  /** Title displayed in the modal */
  title: string;
  /** Message displayed below the title */
  message: string;
  /** Whether TOTP is enabled (shows code input if true) */
  totpEnabled: boolean;
  /** Callback when confirm button is clicked, receives TOTP code if enabled */
  onConfirm: (totpCode?: string) => void;
  /** Whether the action is in progress */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Props for the trigger button */
  triggerProps?: Omit<ButtonProps, "onClick"> & {
    children: React.ReactNode;
  };
  /** Variant for the confirm button */
  confirmVariant?: ButtonProps["variant"];
  /** Text for the confirm button */
  confirmText?: string;
  /** Loading text for the confirm button */
  confirmLoadingText?: string;
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

/**
 * Reusable modal with optional TOTP verification.
 * Shows a 6-digit code input when totpEnabled is true.
 */
export function TotpModal({
  title,
  message,
  totpEnabled,
  onConfirm,
  isLoading = false,
  error,
  triggerProps,
  confirmVariant = "destructive",
  confirmText = "Confirm",
  confirmLoadingText = "Processing...",
}: TotpModalProps) {
  const [totpCode, setTotpCode] = React.useState("");

  const isValidCode = /^\d{6}$/.test(totpCode);

  const handleConfirm = () => {
    if (totpEnabled && !isValidCode) return;
    onConfirm(totpEnabled ? totpCode : undefined);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
  };

  return (
    <Modal>
      <ModalTrigger asChild>
        <Button {...triggerProps} />
      </ModalTrigger>
      <ModalContent size="md">
        <div className="totp-modal">
          <h3 className="totp-modal__title">{title}</h3>
          <p className="totp-modal__message">{message}</p>

          {totpEnabled && (
            <>
              <p className="totp-modal__message">
                Enter your <strong>6-digit authenticator code</strong> to confirm.
              </p>
              <Input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={totpCode}
                onChange={handleCodeChange}
                className="totp-modal__input"
              />
            </>
          )}

          {error && <p className="totp-modal__error">{error}</p>}

          <div className="totp-modal__actions">
            <Button
              variant={confirmVariant}
              size="md"
              onClick={handleConfirm}
              disabled={isLoading || (totpEnabled && !isValidCode)}
              state={isLoading ? "loading" : "default"}
            >
              {isLoading ? confirmLoadingText : confirmText}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────
// Trigger Component (for custom trigger elements)
// ──────────────────────────────────────────────────────────────

export interface TotpModalTriggerProps {
  children: React.ReactNode;
}

/**
 * Wrapper for custom trigger elements inside TotpModal.
 * Use this when you need a non-Button trigger (e.g., MenubarItem).
 */
export function TotpModalTrigger({ children }: TotpModalTriggerProps) {
  return <ModalTrigger asChild>{children}</ModalTrigger>;
}

// ──────────────────────────────────────────────────────────────
// Content Component (for use with custom trigger)
// ──────────────────────────────────────────────────────────────

export interface TotpModalContentProps {
  title: string;
  message: string;
  totpEnabled: boolean;
  onConfirm: (totpCode?: string) => void;
  isLoading?: boolean;
  error?: string;
  confirmVariant?: ButtonProps["variant"];
  confirmText?: string;
  confirmLoadingText?: string;
  /** Controlled TOTP code (from store) */
  totpCode?: string;
  /** Callback when TOTP code changes */
  onTotpCodeChange?: (code: string) => void;
  /** Show cancel button */
  showCancel?: boolean;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
}

/**
 * Modal content for TOTP verification.
 * Use with TotpModalTrigger when you need a custom trigger.
 * Supports both controlled (external state) and uncontrolled (internal state) modes.
 */
export function TotpModalContent({
  title,
  message,
  totpEnabled,
  onConfirm,
  isLoading = false,
  error,
  confirmVariant = "destructive",
  confirmText = "Confirm",
  confirmLoadingText = "Processing...",
  totpCode: controlledCode,
  onTotpCodeChange,
  showCancel = false,
  onCancel,
}: TotpModalContentProps) {
  // Internal state for uncontrolled mode
  const [internalCode, setInternalCode] = React.useState("");

  // Use controlled code if provided, otherwise internal state
  const totpCode = controlledCode ?? internalCode;
  const setTotpCode = onTotpCodeChange ?? setInternalCode;

  const isValidCode = /^\d{6}$/.test(totpCode);

  const handleConfirm = () => {
    if (totpEnabled && !isValidCode) return;
    onConfirm(totpEnabled ? totpCode : undefined);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
  };

  return (
    <ModalContent size="md">
      <div className="totp-modal">
        <h3 className="totp-modal__title">{title}</h3>
        <p className="totp-modal__message">{message}</p>

        {totpEnabled && (
          <>
            <p className="totp-modal__message">
              Enter your <strong>6-digit authenticator code</strong> to confirm.
            </p>
            <Input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={totpCode}
              onChange={handleCodeChange}
              className="totp-modal__input"
            />
          </>
        )}

        {error && <p className="totp-modal__error">{error}</p>}

        <div className="totp-modal__actions">
          {showCancel && (
            <Button variant="secondary" size="md" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant={confirmVariant}
            size="md"
            onClick={handleConfirm}
            disabled={isLoading || (totpEnabled && !isValidCode)}
            state={isLoading ? "loading" : "default"}
          >
            {isLoading ? confirmLoadingText : confirmText}
          </Button>
        </div>
      </div>
    </ModalContent>
  );
}
