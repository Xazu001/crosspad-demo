import { TwoFactorTutorial } from "#/components/custom/two-factor-tutorial";
import { Switch } from "#/components/ui/switch";

// ──────────────────────────────────────────────────────────────
// Two Factor Section
// ──────────────────────────────────────────────────────────────

interface TwoFactorSectionProps {
  totpEnabled: boolean;
  onToggle: (checked: boolean) => void;
  isSubmitting: boolean;
}

export function TwoFactorSection({ totpEnabled, onToggle, isSubmitting }: TwoFactorSectionProps) {
  return (
    <div className="profile__content-settings-totp">
      <h4>Two-Factor Authentication</h4>
      <div className="profile__content-settings-totp-wrapper">
        <Switch
          variant="glass-card"
          checked={totpEnabled}
          onCheckedChange={onToggle}
          disabled={isSubmitting}
        />
        <p>
          Add an extra layer of security to your account by requiring both your password and an
          authenticator code.
          <br />
          {totpEnabled
            ? "2FA is currently enabled – your account is protected!"
            : "Enable 2FA for extra safety – it's highly recommended!"}
        </p>
      </div>
      <div className="profile__content-settings-totp-tutorial">
        <TwoFactorTutorial is2FAEnabled={totpEnabled} onEnable={() => onToggle(true)} />
      </div>
    </div>
  );
}
