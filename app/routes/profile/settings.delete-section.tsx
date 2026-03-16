import { Button } from "#/components/ui/button";

// ──────────────────────────────────────────────────────────────
// Delete Account Section
// ──────────────────────────────────────────────────────────────

interface DeleteAccountSectionProps {
  onDeleteClick: () => void;
  isSubmitting: boolean;
}

export function DeleteAccountSection({ onDeleteClick, isSubmitting }: DeleteAccountSectionProps) {
  return (
    <div className="profile__content-settings-delete">
      <h4>Delete Account</h4>
      <div className="profile__content-settings-delete-wrapper">
        <Button
          variant="glass-destructive"
          onClick={onDeleteClick}
          state={isSubmitting ? "loading" : "default"}
          disabled={isSubmitting}
        >
          Delete
        </Button>
        <p>
          Before deleting aknowledge with{" "}
          <a href="/legal/terms#9-termination" className="link-decorated">
            our terms
          </a>
          <br />
          This action can be undone within 24 days!
        </p>
      </div>
    </div>
  );
}
