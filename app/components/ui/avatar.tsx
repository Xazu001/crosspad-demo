import "./avatar.style.scss";

import * as React from "react";

import { cn } from "#/components/utils";
import {
  type ResponsiveSizeConfig,
  useResponsiveClasses,
} from "#/components/utils/responsive-size";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ──────────────────────────────────────────────────────────────
// Avatar Component
// ──────────────────────────────────────────────────────────────

/** Avatar variants for size and shape */
const avatarVariants = createVariants("avatar", {
  variants: {
    size: {
      sm: "avatar--sm", // Small avatar (32px)
      md: "avatar--md", // Medium avatar (48px)
      lg: "avatar--lg", // Large avatar (64px)
      xl: "avatar--xl", // Extra large (80px)
      "2xl": "avatar--2xl", // Double extra large (96px)
    },
    shape: {
      circle: "avatar--circle", // Circular avatar
      square: "avatar--square", // Square avatar
    },
  },
  defaultVariants: {
    size: "md",
    shape: "circle",
  },
});

/** Avatar image component with fallback support */
export interface AvatarProps
  extends React.ImgHTMLAttributes<HTMLImageElement>, VariantProps<typeof avatarVariants> {
  /** Fallback source when image fails to load */
  fallbackSrc?: string;
  /** Whether to show a border */
  bordered?: boolean;
  /** Whether to enable hover animations */
  hover?: boolean;
  boxStyle?: React.CSSProperties;
  responsiveSize?: ResponsiveSizeConfig<"sm" | "md" | "lg" | "xl" | "2xl">;
}

const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  (
    {
      className,
      size,
      shape,
      responsiveSize,
      fallbackSrc = "/assets/default-avatar.png",
      bordered = false,
      hover = false,
      src,
      alt,
      onError,
      boxStyle,
      ...props
    },
    ref,
  ) => {
    const [imgError, setImgError] = React.useState(false);
    const [_imgLoading, setImgLoaded] = React.useState(false);

    // Universal responsive classes hook - eliminates boilerplate
    const { currentSize, responsiveClasses } = useResponsiveClasses(
      responsiveSize,
      "avatar",
      size || "md",
    );

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setImgError(true);
      onError?.(e);
    };

    const handleLoad = () => {
      setImgLoaded(true);
      setImgError(false);
    };

    // Reset error state when src changes
    React.useEffect(() => {
      if (src) {
        setImgError(false);
        setImgLoaded(false);
      }
    }, [src]);

    const avatarClasses = cn(
      avatarVariants({ size: currentSize, shape, className }),
      responsiveClasses,
      bordered && "avatar--bordered",
      hover && "avatar--hover",
    );

    // Show fallback when no src or error
    if (!src || imgError) {
      return (
        <div className={avatarClasses}>
          <div className="avatar__fallback">
            {fallbackSrc && (
              <img
                src={fallbackSrc}
                alt={alt || "Avatar"}
                className="avatar__fallback-img"
                ref={ref}
              />
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={avatarClasses} style={boxStyle}>
        <img src={src} alt={alt} ref={ref} onError={handleError} onLoad={handleLoad} {...props} />
      </div>
    );
  },
);

Avatar.displayName = "Avatar";

export { Avatar, avatarVariants };
