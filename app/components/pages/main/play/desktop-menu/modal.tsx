import { cn } from "#/components/utils";

interface ModalProps {
  isActive: boolean;
  children: React.ReactNode;
}

export function Modal({ isActive, children }: ModalProps) {
  return (
    <div className={cn("kit-play-desktop__modal", isActive && "kit-play-desktop__modal--active")}>
      {children}
    </div>
  );
}
