import "./image.style.scss";

import * as React from "react";

import { cn } from "#/components/utils";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ──────────────────────────────────────────────────────────────
// Image Component
// ──────────────────────────────────────────────────────────────

/** Image variants for object-fit and border-radius */
const imageVariants = createVariants("image", {
  variants: {
    fit: {
      cover: "image--cover",
      contain: "image--contain",
      fill: "image--fill",
      none: "image--none",
    },
    radius: {
      none: "image--radius-none",
      sm: "image--radius-sm",
      md: "image--radius-md",
      lg: "image--radius-lg",
      xl: "image--radius-xl",
      full: "image--radius-full",
    },
  },
  defaultVariants: {
    fit: "cover",
    radius: "none",
  },
});

/** Image component with skeleton loader support */
export interface ImageProps
  extends
    Omit<React.ImgHTMLAttributes<HTMLImageElement>, "placeholder">,
    VariantProps<typeof imageVariants> {
  /** Custom loading component to replace skeleton */
  customLoader?: React.ReactNode;
  /** Whether to show skeleton loader while loading */
  showLoader?: boolean;
  /** Fallback source when image fails to load */
  fallbackSrc?: string;
  /** Aspect ratio for the container (e.g., "16/9", "1/1", "4/3") */
  aspectRatio?: string;
  /** Whether to apply a fade-in effect on load */
  fadeIn?: boolean;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      className,
      fit,
      radius,
      src,
      alt,
      customLoader,
      showLoader = true,
      fallbackSrc,
      onLoad,
      onError,
      aspectRatio,
      fadeIn = true,
      style,
      ...props
    },
    forwardedRef,
  ) => {
    const imgRef = React.useRef<HTMLImageElement>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasError, setHasError] = React.useState(false);

    const currentSrc = hasError && fallbackSrc ? fallbackSrc : src;

    // Handle image already loaded from cache (SSR hydration fix)
    React.useLayoutEffect(() => {
      const img = imgRef.current;
      if (img?.complete && img.naturalWidth > 0) {
        setIsLoading(false);
      }
    }, [currentSrc]);

    // Reset states when src changes
    React.useEffect(() => {
      if (src) {
        setHasError(false);
        const img = imgRef.current;
        if (!img?.complete) {
          setIsLoading(true);
        }
      }
    }, [src]);

    const handleLoad = React.useCallback(
      (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setIsLoading(false);
        setHasError(false);
        onLoad?.(e);
      },
      [onLoad],
    );

    const handleError = React.useCallback(
      (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setIsLoading(false);
        setHasError(true);
        onError?.(e);
      },
      [onError],
    );

    // Merge refs
    const setRefs = React.useCallback(
      (node: HTMLImageElement | null) => {
        (imgRef as React.MutableRefObject<HTMLImageElement | null>).current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    const containerStyle: React.CSSProperties = React.useMemo(
      () => ({
        ...style,
        ...(aspectRatio && { aspectRatio }),
      }),
      [style, aspectRatio],
    );

    const imageClasses = cn(
      imageVariants({ fit, radius, className }),
      fadeIn && "image--fade-in",
      isLoading && "image--loading",
    );

    return (
      <div className={imageClasses} style={containerStyle}>
        {showLoader &&
          isLoading &&
          (customLoader ? (
            <div className="image__loader">{customLoader}</div>
          ) : (
            <div className="image__skeleton">
              <div className="image__skeleton-shimmer" />
            </div>
          ))}
        {currentSrc && (
          <img
            ref={setRefs}
            src={currentSrc}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            decoding="async"
            {...props}
          />
        )}
      </div>
    );
  },
);

Image.displayName = "Image";

export { Image, imageVariants };
