import "./two-factor-tutorial.style.scss";

import * as React from "react";

import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { Modal, ModalContent, ModalTrigger } from "#/components/ui/modal";
import { cn } from "#/components/utils";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface TwoFactorTutorialProps {
  /** Callback when user completes the tutorial */
  onComplete?: () => void;
  /** Callback when user clicks "Enable 2FA" */
  onEnable?: () => void;
  /** Whether 2FA is currently enabled */
  is2FAEnabled?: boolean;
  /** Trigger element (button, link, etc.) */
  trigger?: React.ReactNode;
}

interface Step {
  number: number;
  title: string;
  description: React.ReactNode;
  icon: React.ReactNode;
}

// ──────────────────────────────────────────────────────────────
// Steps Data
// ──────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    number: 1,
    title: "Download an Authenticator App",
    description: (
      <>
        Download <strong>Google Authenticator</strong>, <strong>Authy</strong>, or{" "}
        <strong>1Password</strong> from your app store. These apps generate time-based codes that
        work offline.
      </>
    ),
    icon: <Icon.Smartphone size="lg" />,
  },
  {
    number: 2,
    title: "Scan the QR Code",
    description: (
      <>
        Open your authenticator app and scan the QR code displayed on screen. Alternatively, you can
        manually enter the secret key provided.
      </>
    ),
    icon: <Icon.QrCode size="lg" />,
  },
  {
    number: 3,
    title: "Enter the 6-Digit Code",
    description: (
      <>
        After scanning, the app will display a 6-digit code. Enter this code to verify the setup is
        working correctly.
      </>
    ),
    icon: <Icon.KeyRound size="lg" />,
  },
  {
    number: 4,
    title: "Save Your Backup Codes",
    description: (
      <>
        You'll receive <strong>backup codes</strong>. Store these in a safe place (password manager,
        printed document). They're your only way to access your account if you lose your
        authenticator device.
      </>
    ),
    icon: <Icon.ShieldCheck size="lg" />,
  },
];

const WHY_RECOMMENDED = [
  "Protects your account from unauthorized access",
  "Adds an extra layer of security",
  "Peace of mind for sensitive actions",
  "Recommended for all users",
];

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

/**
 * Tutorial modal explaining how to set up 2FA with Google Authenticator.
 * Shows step-by-step guide and explains why 2FA is recommended for safety.
 */
export function TwoFactorTutorial({
  onComplete,
  onEnable,
  is2FAEnabled = false,
  trigger,
}: TwoFactorTutorialProps) {
  const [currentStep, setCurrentStep] = React.useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete?.();
    setCurrentStep(0);
  };

  const handleEnable = () => {
    onEnable?.();
    setCurrentStep(0);
  };

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <Modal>
      <ModalTrigger>
        {trigger || (
          <Button variant="glass-card" size="sm">
            <Icon.Info size="sm" />
            How to set up 2FA
          </Button>
        )}
      </ModalTrigger>

      <ModalContent size="lg" className="two-factor-tutorial">
        {/* Header */}
        <div className="two-factor-tutorial__header">
          <h3>Two-Factor Authentication Guide</h3>
          <p>Protect your account with an extra layer of security using an authenticator app.</p>
        </div>

        {/* Progress */}
        <div className="two-factor-tutorial__progress">
          {STEPS.map((_, index) => (
            <button
              key={index}
              className={cn(
                "two-factor-tutorial__progress-dot",
                index === currentStep && "two-factor-tutorial__progress-dot--active",
                index < currentStep && "two-factor-tutorial__progress-dot--completed",
              )}
              onClick={() => setCurrentStep(index)}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Current Step */}
        <div className="two-factor-tutorial__step">
          <div className="two-factor-tutorial__step-icon">{step.icon}</div>
          <div className="two-factor-tutorial__step-content">
            <span className="two-factor-tutorial__step-number">
              Step {step.number} of {STEPS.length}
            </span>
            <h4>{step.title}</h4>
            <p>{step.description}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="two-factor-tutorial__nav">
          <Button variant="secondary" size="sm" onClick={handlePrev} disabled={currentStep === 0}>
            <Icon.ChevronLeft size="sm" />
            Previous
          </Button>

          {isLastStep ? (
            <div className="two-factor-tutorial__actions">
              <Button variant="primary" size="sm" onClick={handleComplete}>
                Got it!
              </Button>
              {!is2FAEnabled && (
                <Button variant="glass-card" size="sm" onClick={handleEnable}>
                  Enable 2FA Now
                </Button>
              )}
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={handleNext}>
              Next
              <Icon.ChevronRight size="sm" />
            </Button>
          )}
        </div>

        {/* Why enable 2FA? */}
        <div className="two-factor-tutorial__info">
          <h5>Why enable 2FA?</h5>
          <ul>
            {WHY_RECOMMENDED.map((item, index) => (
              <li key={index}>
                <Icon.ShieldCheck size="sm" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </ModalContent>
    </Modal>
  );
}
