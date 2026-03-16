import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Modal, ModalContent } from "#/components/ui/modal";

// ──────────────────────────────────────────────────────────────
// Delete Account Modal
// ──────────────────────────────────────────────────────────────

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totpEnabled: boolean;
  totpCode: string;
  totpError: string | null;
  setTotpCode: (code: string) => void;
  setTotpError: (error: string | null) => void;
  onConfirm: (totpCode: string) => void;
  isSubmitting: boolean;
}

export function DeleteAccountModal({
  open,
  onOpenChange,
  totpEnabled,
  totpCode,
  totpError,
  setTotpCode,
  setTotpError,
  onConfirm,
  isSubmitting,
}: DeleteAccountModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg">
        <div className="profile__delete-modal">
          <h3>Delete Account</h3>
          <p>
            Clicking <strong>Delete</strong> will anonymize your account after a 24-day grace
            period:
          </p>
          <ul>
            <li>Your username becomes "User" and avatar is removed</li>
            <li>Your login credentials are deleted (you cannot log in)</li>
            <li>Your public kits and sounds remain visible</li>
            <li>
              You can <strong>undo</strong> this within 24 days by clicking "Undo Account Deletion"
              on your email!
            </li>
          </ul>
          <p>
            For <strong>complete deletion</strong> (removes all kits, sounds, and data permanently):
          </p>
          <ol>
            <li>Click Delete below — you'll receive a deletion code via email</li>
            <li>
              Visit our <a href="/contact">Contact Form</a>
            </li>
            <li>Select "Account Deletion Request", enter your email and deletion code</li>
            <li>Agree to both checkboxes and submit</li>
          </ol>
          <div className="profile__delete-modal-actions">
            {totpEnabled && (
              <div className="profile__delete-modal-totp">
                <Input
                  variant="glass"
                  type="text"
                  placeholder="Enter authenticator code"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => {
                    setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  }}
                />
                {totpError && <span className="form-error">{totpError}</span>}
              </div>
            )}
            <Button
              variant="glass-destructive"
              onClick={() => {
                if (totpEnabled && totpCode.length !== 6) {
                  setTotpError("Enter 6-digit code");
                  return;
                }
                onOpenChange(false);
                onConfirm(totpCode);
              }}
              disabled={isSubmitting}
            >
              Confirm
            </Button>
            <Button variant="glass" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
