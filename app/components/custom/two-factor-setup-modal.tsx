import "./two-factor-setup-modal.style.scss";

import * as React from "react";

import QRCode from "qrcode";

import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { Input } from "#/components/ui/input";
import { Modal, ModalContent } from "#/components/ui/modal";
import { useTwoFactorSettingsStore } from "#/lib/stores/two-factor-settings";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface TwoFactorSetupModalProps {
  /** Callback when user verifies the code */
  onVerify: (code: string) => Promise<boolean>;
  /** Callback when setup is complete */
  onComplete?: () => void;
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

/**
 * Modal for setting up 2FA - shows QR code, secret, and backup codes.
 * Requires user to verify with a code before completing setup.
 * Uses Zustand store for open state and setup data.
 */
export function TwoFactorSetupModal({ onVerify, onComplete }: TwoFactorSetupModalProps) {
  // Get state from Zustand store
  const {
    showSetupModal: open,
    setupData,
    setShowSetupModal: onOpenChange,
    setSetupData,
  } = useTwoFactorSettingsStore();

  // Local UI state
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");
  const [verificationCode, setVerificationCode] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<"scan" | "verify" | "backup">("scan");
  const [copiedSecret, setCopiedSecret] = React.useState(false);
  const [copiedBackup, setCopiedBackup] = React.useState(false);

  // Derive data from store
  const otpauthUrl = setupData?.otpauthUrl ?? "";
  const secret = setupData?.secret ?? "";
  const backupCodes = setupData?.backupCodes ?? [];

  // Generate QR code when otpauthUrl changes
  React.useEffect(() => {
    if (otpauthUrl) {
      QRCode.toDataURL(otpauthUrl, {
        width: 264,
        margin: 1,
        color: {
          dark: "#ffffff",
          light: "#00000000",
        },
      })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [otpauthUrl]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setStep("scan");
      setVerificationCode("");
      setVerifyError(null);
      setCopiedSecret(false);
      setCopiedBackup(false);
    }
  }, [open]);

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setVerifyError("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const success = await onVerify(verificationCode);
      if (success) {
        setStep("backup");
      } else {
        setVerifyError("Invalid code. Please try again.");
      }
    } catch {
      setVerifyError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleComplete = () => {
    onComplete?.();
    setSetupData(null);
    onOpenChange(false);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(value);
    setVerifyError(null);
  };

  // Don't render modal content if no setup data
  if (!setupData) return null;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" className="two-factor-setup">
        {/* Header */}
        <div className="two-factor-setup__header">
          <h3>
            {step === "scan" && "Scan QR Code"}
            {step === "verify" && "Verify Setup"}
            {step === "backup" && "Save Backup Codes"}
          </h3>
          <p>
            {step === "scan" && "Scan this QR code with your authenticator app"}
            {step === "verify" && "Enter the 6-digit code from your authenticator app"}
            {step === "backup" && "Store these codes in a safe place"}
          </p>
        </div>

        {/* Step: Scan QR Code */}
        {step === "scan" && (
          <div className="two-factor-setup__scan">
            <div className="two-factor-setup__qr">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="2FA QR Code" />
              ) : (
                <div className="two-factor-setup__qr-loading">Loading...</div>
              )}
            </div>

            <div className="two-factor-setup__manual">
              <h4>Can't scan? Enter manually:</h4>
              <div className="two-factor-setup__secret">
                <code>{secret}</code>
                <Button variant="ghost" size="sm" onClick={handleCopySecret}>
                  {copiedSecret ? <Icon.Check size="sm" /> : <Icon.Download size="sm" />}
                </Button>
              </div>
            </div>

            <div className="two-factor-setup__actions">
              <Button variant="primary" onClick={() => setStep("verify")}>
                I've scanned the code
                <Icon.ChevronRight size="sm" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Verify */}
        {step === "verify" && (
          <div className="two-factor-setup__verify">
            <div className="two-factor-setup__verify-input">
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={handleCodeChange}
                className="two-factor-setup__code-input"
                autoFocus
              />
              {verifyError && <p className="two-factor-setup__error">{verifyError}</p>}
            </div>

            <div className="two-factor-setup__actions">
              <Button variant="secondary" onClick={() => setStep("scan")}>
                <Icon.ChevronLeft size="sm" />
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleVerify}
                state={isVerifying ? "loading" : "default"}
                disabled={verificationCode.length !== 6}
              >
                Verify Code
              </Button>
            </div>
          </div>
        )}

        {/* Step: Backup Codes */}
        {step === "backup" && (
          <div className="two-factor-setup__backup">
            <div className="two-factor-setup__backup-warning">
              <Icon.AlertCircle size="lg" />
              <p>
                <strong>Important:</strong> These backup codes are the only way to access your
                account if you lose your authenticator device. Store them securely.
              </p>
            </div>

            <div className="two-factor-setup__backup-codes">
              {backupCodes.map((code, index) => (
                <code key={index}>{code}</code>
              ))}
            </div>

            <div className="two-factor-setup__actions">
              <Button variant="secondary" size="sm" onClick={handleCopyBackupCodes}>
                {copiedBackup ? (
                  <>
                    <Icon.Check size="sm" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Icon.Download size="sm" />
                    Copy All Codes
                  </>
                )}
              </Button>
              <Button size="sm" variant="primary" onClick={handleComplete}>
                <Icon.ShieldCheck size="sm" />
                I've saved my codes
              </Button>
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
