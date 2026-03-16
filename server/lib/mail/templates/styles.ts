// Design variables - used across all email templates
export const vars = {
  borderRadius: "32px",
  spacing: {
    small: "12px",
    medium: "16px",
    large: "24px",
  },
  colors: {
    background: "#f5f5f5",
    container: "#ffffff",
    text: "#333333",
    textMuted: "#666666",
    primary: "#90db1e",
    border: "#cccccc",
  },
  fonts: {
    primary: "Arial, sans-serif",
  },
};

// Reusable inline styles for email templates
export const styles = {
  // Title heading - used for main email titles
  title: {
    fontFamily: vars.fonts.primary,
    fontSize: "24px",
    lineHeight: "150%",
    margin: "0 0 20px 0",
    color: vars.colors.text,
  },

  // Body text - used for main content paragraphs
  body: {
    fontFamily: vars.fonts.primary,
    fontSize: "16px",
    lineHeight: "1.5",
    margin: "0 0 20px 0",
    color: vars.colors.text,
  },

  // Footer text - smaller muted text
  footer: {
    color: vars.colors.textMuted,
    fontSize: "14px",
    textAlign: "center",
    margin: "0 0 24px 0",
  },

  // Footer link - for footer navigation links
  footerLink: {
    color: vars.colors.textMuted,
    textDecoration: "none",
    fontSize: "14px",
    margin: "0 10px",
  },

  // Brand link - primary colored links
  brandLink: {
    color: vars.colors.primary,
    fontWeight: "bold",
    textDecoration: "none",
    fontSize: "16px",
  },

  // Divider - vertical separator
  divider: {
    display: "inline-block",
    width: "1px",
    height: "14px",
    backgroundColor: vars.colors.border,
    verticalAlign: "middle",
    margin: "0 10px",
  },

  // Image - full width rounded image
  image: {
    width: "100%",
    borderRadius: vars.borderRadius,
    display: "block",
  },
} as const;
