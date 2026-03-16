export type CVAElementBaseVariant = {
  variant?: any;
  size: Record<ElementSize, string>;
};

export type ElementSize = "sm" | "default" | "lg";

// Breakpoint types based on $site-breakpoints in _tokens.scss
export type Breakpoint =
  | "phone"
  | "tablet"
  | "desktop"
  | "large-desktop"
  | "xlarge-desktop"
  | "huge";

export interface InfoPreviewData {
  owner: {
    user_name: string | null;
    user_avatar_source: string | null;
  };
  kit_description: string | null;
}
