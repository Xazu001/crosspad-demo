import "./file-drop.style.scss";

import * as React from "react";

import { cn } from "#/components/utils";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ──────────────────────────────────────────────────────────────
// File Drop Component
// ──────────────────────────────────────────────────────────────

/** File drop variants for different states */
const fileDropVariants = createVariants("file-drop", {
  variants: {
    variant: {
      card: "file-drop--card", // Card state (default)
    },
    size: {
      md: "file-drop--md", // Medium size
    },
  },
  defaultVariants: {
    variant: "card",
    size: "md",
  },
});

/** Drag and drop file upload component */
export interface FileDropProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof fileDropVariants> {
  /** Accepted file types */
  accept?: string;
  /** Allow multiple files */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Callback when files are dropped */
  onFilesDrop?: (files: File[]) => void;
  /** Callback when drag enters */
  onDragEnter?: () => void;
  /** Callback when drag leaves */
  onDragLeave?: () => void;
  /** Disable the drop zone */
  disabled?: boolean;
  children?: React.ReactNode;
  /** Whether to convert SVG files to WebP */
  convertSvgToWebP?: boolean;
  /** Quality for WebP conversion (0-1) */
  webpQuality?: number;
}

const FileDrop = React.forwardRef<HTMLDivElement, FileDropProps>(
  (
    {
      className,
      variant,
      size,
      accept,
      multiple = false,
      maxSize,
      onFilesDrop,
      onDragEnter,
      onDragLeave,
      disabled = false,
      children,
      convertSvgToWebP = false,
      webpQuality = 0.9,
      ...props
    },
    ref,
  ) => {
    const [isDragActive, setIsDragActive] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleDragEnter = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;

        setIsDragActive(true);
        setError(null);
        onDragEnter?.();
      },
      [disabled, onDragEnter],
    );

    const handleDragLeave = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;

        setIsDragActive(false);
        onDragLeave?.();
      },
      [disabled, onDragLeave],
    );

    const handleDragOver = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
      },
      [disabled],
    );

    const validateFiles = React.useCallback(
      (files: FileList) => {
        const validFiles: File[] = [];
        const acceptedTypes = accept ? accept.split(",").map((t) => t.trim()) : [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          // Check file type
          if (accept && acceptedTypes.length > 0) {
            const isAccepted = acceptedTypes.some((type) => {
              // Handle wildcards
              if (type.includes("*")) {
                const pattern = type.replace("*", ".*");
                return file.type.match(pattern);
              }
              // Exact match or common variations
              return (
                file.type === type ||
                // Common WAV variations
                (type === "audio/wav" &&
                  (file.type === "audio/x-wav" || file.type === "audio/wav")) ||
                // Common MP3 variations
                (type === "audio/mp3" &&
                  (file.type === "audio/mpeg" || file.type === "audio/mp3")) ||
                (type === "audio/mpeg" && (file.type === "audio/mp3" || file.type === "audio/mpeg"))
              );
            });

            if (!isAccepted) {
              setError(`File type ${file.type} is not accepted`);
              return null;
            }
          }

          // Check file size
          if (maxSize && file.size > maxSize) {
            setError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
            return null;
          }

          validFiles.push(file);
        }

        return validFiles;
      },
      [accept, maxSize],
    );

    const handleDrop = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;

        setIsDragActive(false);

        const files = validateFiles(e.dataTransfer.files);
        if (files) {
          setError(null);
          onFilesDrop?.(files);
        }
      },
      [disabled, validateFiles, onFilesDrop],
    );

    const handleFileInput = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || disabled) return;

        const files = validateFiles(e.target.files);
        if (files) {
          setError(null);
          onFilesDrop?.(files);
        }

        // Reset input value to allow selecting the same file again
        e.target.value = "";
      },
      [disabled, validateFiles, onFilesDrop],
    );

    const currentVariant = error ? undefined : variant;

    return (
      <div
        ref={ref}
        className={cn(
          fileDropVariants({ variant: currentVariant, size, className }),
          error && "file-drop--error",
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-disabled={disabled}
        {...props}
      >
        <input
          type="file"
          className="file-drop__input"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
        />
        {children || (
          <div className="file-drop__content">
            <div className="file-drop__icon">
              {isDragActive ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20M2 12h20" />
                </svg>
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
            </div>
            <div className="file-drop__text">
              {error ? (
                <span className="file-drop__error">{error}</span>
              ) : isDragActive ? (
                <span>Drop files here</span>
              ) : (
                <>
                  <span>Drag & drop files here, or </span>
                  <button
                    type="button"
                    className="file-drop__button"
                    onClick={() => {
                      const input = document.querySelector(".file-drop__input") as HTMLInputElement;
                      input?.click();
                    }}
                  >
                    browse
                  </button>
                </>
              )}
            </div>
            {accept && (
              <div className="file-drop__hint">
                Accepted:{" "}
                {accept
                  .split(",")
                  .map((type) => type.replace(/.*\//, "").replace(/\*/g, "any"))
                  .join(", ")}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

FileDrop.displayName = "FileDrop";

export { FileDrop, fileDropVariants };
