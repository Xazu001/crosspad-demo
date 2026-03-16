import "./mobile-message.style.scss";

import { cn } from "#/components/utils";

// ──────────────────────────────────────────────────────────────

interface MobileMessageProps {
  /** Message description */
  description?: string;
  /** Additional CSS classes */
  className?: string;
}

/** Mobile message component */
export function MobileMessage({ description, className }: MobileMessageProps) {
  return (
    <div className={cn("mobile-message", className)}>
      <div className="mobile-message__content">
        {description && <p className="mobile-message__description">{description}</p>}
      </div>
    </div>
  );
}
