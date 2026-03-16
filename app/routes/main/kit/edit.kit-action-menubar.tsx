import { useEffect, useState } from "react";

import { toast } from "react-toastify";

import { TotpModalContent, TotpModalTrigger } from "#/components/custom/totp-modal";
import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { Menubar, MenubarItem, MenubarSeparator } from "#/components/ui/menubar";
import { Modal, ModalContent, ModalTrigger } from "#/components/ui/modal";
import { useKitEditActions, useKitEditStore } from "#/lib/stores/kit-edit";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface Kit {
  kit_id: number;
  kit_name: string;
  kit_description: string | null;
  kit_logo_source: string | null;
  kit_colors: string | null;
  kit_status: string;
}

// ──────────────────────────────────────────────────────────────
// Delete Modal
// ──────────────────────────────────────────────────────────────

interface DeleteModalProps {
  kitId: number;
  kitName: string;
  totpEnabled: boolean;
  onDelete: (kitId: number, totpCode?: string) => void;
  isDeleting: boolean;
  error?: string;
}

function DeleteModal({
  kitId,
  kitName,
  totpEnabled,
  onDelete,
  isDeleting,
  error,
}: DeleteModalProps) {
  return (
    <Modal>
      <TotpModalTrigger>
        <MenubarItem className="menubar__item--destructive">
          <Icon.Trash size="sm" />
          <span>Delete Kit</span>
        </MenubarItem>
      </TotpModalTrigger>
      <TotpModalContent
        title={`Delete ${kitName}`}
        message="Are you sure you want to delete this kit? This action is permanent."
        totpEnabled={totpEnabled}
        onConfirm={(totpCode) => onDelete(kitId, totpCode)}
        isLoading={isDeleting}
        error={error}
        confirmVariant="destructive"
        confirmText="Confirm Delete"
        confirmLoadingText="Deleting..."
      />
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────
// Transfer Modal
// ──────────────────────────────────────────────────────────────

interface TransferModalProps {
  kitId: number;
  kitName: string;
  onCreateCode: (kitId: number) => void;
  isCreating: boolean;
  error?: string;
}

function TransferModal({ kitId, kitName, onCreateCode, isCreating, error }: TransferModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerate = () => {
    onCreateCode(kitId);
  };

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalTrigger asChild>
        <MenubarItem>
          <Icon.ArrowUpRight size="sm" />
          <span>Transfer Kit</span>
        </MenubarItem>
      </ModalTrigger>
      <ModalContent size="md">
        <div className="transfer-modal">
          <h3 className="transfer-modal__title">Transfer Kit</h3>
          <p className="transfer-modal__message">
            Generate a transfer code for <strong>{kitName}</strong>. Share this code with the
            recipient to transfer ownership.
          </p>

          <div className="transfer-modal__generate">
            {error && <p className="transfer-modal__error">{error}</p>}
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerate}
              state={isCreating ? "loading" : "default"}
            >
              Generate Code
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────
// View Code Modal
// ──────────────────────────────────────────────────────────────

interface ViewCodeModalProps {
  kitName: string;
  transferCode: string;
  expiresAt: number;
  onCancel: (code: string) => void;
  isCanceling: boolean;
  /** Whether modal should start open (true when code was just generated) */
  startOpen?: boolean;
  /** Callback when modal has opened (to clear auto-open flag) */
  onOpened?: () => void;
}

function ViewCodeModal({
  kitName,
  transferCode,
  expiresAt,
  onCancel,
  isCanceling,
  startOpen = false,
  onOpened,
}: ViewCodeModalProps) {
  const [isOpen, setIsOpen] = useState(startOpen);

  // Notify parent when modal opens due to startOpen
  useEffect(() => {
    if (startOpen && isOpen) {
      onOpened?.();
    }
  }, [startOpen, isOpen, onOpened]);

  const handleCopy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(transferCode).catch((err) => {
        console.error("Clipboard failed:", err);
      });
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = transferCode;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    toast.success("Copied to clipboard!");
  };

  const formatExpiry = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalTrigger asChild>
        <MenubarItem>
          <Icon.KeyRound size="sm" />
          <span>View Code</span>
        </MenubarItem>
      </ModalTrigger>
      <ModalContent size="md">
        <div className="transfer-modal">
          <h3 className="transfer-modal__title">Transfer Code</h3>
          <p className="transfer-modal__message">
            Transfer code for <strong>{kitName}</strong>. Share this code with the recipient to
            transfer ownership.
          </p>

          <div className="transfer-modal__code-section">
            <div className="transfer-modal__code">
              <code>{transferCode}</code>
            </div>
            <p className="transfer-modal__expiry">Valid until: {formatExpiry(expiresAt)}</p>
            <div className="transfer-modal__actions">
              <Button
                variant="primary"
                size="md"
                onClick={handleCopy}
                className="transfer-modal__copy-btn"
              >
                Copy Code
              </Button>
              <Button
                variant="destructive"
                size="md"
                onClick={() => onCancel(transferCode)}
                disabled={isCanceling}
              >
                {isCanceling ? "Canceling..." : "Cancel Transfer"}
              </Button>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────
// Kit Action Menubar
// ──────────────────────────────────────────────────────────────

interface KitActionMenubarProps {
  kit: Kit;
  totpEnabled: boolean;
}

export function KitActionMenubar({ kit, totpEnabled }: KitActionMenubarProps) {
  const { transferCodes, justGeneratedKitId, clearJustGeneratedKitId } = useKitEditStore();
  const {
    deleteKit,
    isDeleting,
    deleteError,
    createTransferCode,
    isCreatingTransfer,
    transferError,
    cancelTransfer,
    isCancelingTransfer,
  } = useKitEditActions();

  const transferEntry = transferCodes.get(kit.kit_id);

  return (
    <Menubar
      variant="popover"
      size="sm"
      trigger={
        <button className="kit-edit__menu-btn" title="Kit actions">
          <Icon.MoreVertical size="sm" />
        </button>
      }
    >
      {transferEntry ? (
        <ViewCodeModal
          kitName={kit.kit_name}
          transferCode={transferEntry.code}
          expiresAt={transferEntry.expiresAt}
          onCancel={cancelTransfer}
          isCanceling={isCancelingTransfer}
          startOpen={justGeneratedKitId === kit.kit_id}
          onOpened={clearJustGeneratedKitId}
        />
      ) : (
        <TransferModal
          kitId={kit.kit_id}
          kitName={kit.kit_name}
          onCreateCode={createTransferCode}
          isCreating={isCreatingTransfer}
          error={transferError}
        />
      )}
      <MenubarSeparator />
      <DeleteModal
        kitId={kit.kit_id}
        kitName={kit.kit_name}
        totpEnabled={totpEnabled}
        onDelete={deleteKit}
        isDeleting={isDeleting}
        error={deleteError}
      />
    </Menubar>
  );
}
