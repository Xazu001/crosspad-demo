import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";

// ──────────────────────────────────────────────────────────────
// Kit Transfer Section
// ──────────────────────────────────────────────────────────────

interface KitTransferSectionProps {
  transferCode: string;
  setTransferCode: (code: string) => void;
  onAccept: () => void;
  isSubmitting: boolean;
  error?: string;
}

export function KitTransferSection({
  transferCode,
  setTransferCode,
  onAccept,
  isSubmitting,
  error,
}: KitTransferSectionProps) {
  return (
    <div className="profile__content-settings-transfer">
      <h4>Accept Kit Transfer</h4>
      <div className="profile__content-settings-transfer-wrapper">
        <Input
          variant="glass"
          type="text"
          placeholder="Enter transfer code"
          value={transferCode}
          onChange={(e) => setTransferCode(e.target.value)}
          className="profile__content-settings-transfer-input"
        />
        <Button
          variant="glass"
          onClick={onAccept}
          disabled={isSubmitting || !transferCode.trim()}
          state={isSubmitting ? "loading" : "default"}
        >
          Accept Transfer
        </Button>
        {error && <p className="profile__content-settings-transfer-error">{error}</p>}
      </div>
      <p className="profile__content-settings-transfer-hint">
        Enter the transfer code shared with you to accept ownership of a kit. Transfer codes expire
        after 7 days.
      </p>
    </div>
  );
}
