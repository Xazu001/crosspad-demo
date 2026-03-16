interface MinimalModalProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  active?: boolean;
}

export function MinimalModal({ children, active, ...props }: MinimalModalProps) {
  return (
    <div
      className={`kit-play-mobile__minimal-modal ${active ? "kit-play-mobile__minimal-modal--active" : ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
