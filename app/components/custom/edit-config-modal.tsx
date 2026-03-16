import * as React from "react";
import { useState } from "react";

import { ConfigGrid } from "#/components/pages/main/play/desktop-menu/controls.grid";
import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { Modal, ModalContent, ModalTrigger } from "#/components/ui/modal";

interface EditConfigModalProps {
  trigger?: React.ReactNode;
}

export function EditConfigModal({ trigger }: EditConfigModalProps) {
  const [activeTab, setActiveTab] = useState<"midi" | "keyboard">("midi");

  return (
    <Modal>
      <ModalTrigger asChild>
        {trigger || (
          <Button variant="kit-play-card" className="kit-play-desktop__edit-config-btn">
            <Icon.Bolt size="sm" />
            Edit Config
          </Button>
        )}
      </ModalTrigger>
      <ModalContent size="lg" variant="kit-play-card">
        <div className="kit-play-desktop__edit-config-content">
          <div className="kit-play-desktop__edit-config-select">
            <Button
              variant="kit-play-card"
              isActive={activeTab === "midi"}
              onClick={() => setActiveTab("midi")}
            >
              MIDI
            </Button>
            <Button
              variant="kit-play-card"
              isActive={activeTab === "keyboard"}
              onClick={() => setActiveTab("keyboard")}
            >
              Keyboard
            </Button>
          </div>
          <div className="kit-play-desktop__edit-config-wrapper">
            <ConfigGrid type={activeTab} />
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
