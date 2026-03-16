import "./file-input.style.scss";

import * as React from "react";

import { Button } from "#/components/ui/button";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ──────────────────────────────────────────────────────────────
// File Input Component
// ──────────────────────────────────────────────────────────────

/** File input variants for different styles and sizes */
const fileInputVariants = createVariants("file-input", {
  variants: {
    variant: {
      secondary: "file-input--secondary", // Secondary style
      card: "file-input--card", // Card style
    },
    size: {
      sm: "file-input--sm", // Small input
      md: "file-input--md", // Medium input
      lg: "file-input--lg", // Large input
    },
  },
  defaultVariants: {
    variant: "secondary",
    size: "md",
  },
});

/** File input component with button trigger */
export interface FileInputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof fileInputVariants> {
  /** Text for the button */
  buttonText?: string;
  /** Accepted file types */
  accept?: string;
  /** Whether to allow multiple files */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Callback when files are selected */
  onFilesSelected?: (files: File[]) => void;
  /** Error message to display */
  error?: string;
  /** Initial file to display */
  initialFile?: File;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      variant,
      size,
      accept,
      multiple = false,
      maxSize,
      onFilesSelected,
      error,
      onChange,
      children,
      initialFile,
      buttonText = "Choose file",
      ...props
    },
    ref,
  ) => {
    const [internalError, setInternalError] = React.useState<string | null>(null);
    const [selectedFile, setSelectedFile] = React.useState<File | null>(initialFile || null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Update selected file when initialFile changes
    React.useEffect(() => {
      setSelectedFile(initialFile || null);
    }, [initialFile]);

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
              // Exact match
              return file.type === type;
            });

            if (!isAccepted) {
              setInternalError(`File type ${file.type} is not accepted`);
              return null;
            }
          }

          // Check file size
          if (maxSize && file.size > maxSize) {
            setInternalError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
            return null;
          }

          validFiles.push(file);
        }

        return validFiles;
      },
      [accept, maxSize],
    );

    const handleChange = React.useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const files = validateFiles(e.target.files);
        if (files) {
          setInternalError(null);
          setSelectedFile(files[0] || null);
          onFilesSelected?.(files);
        }

        // Reset input value to allow selecting the same file again
        e.target.value = "";
        onChange?.(e);
      },
      [validateFiles, onFilesSelected, onChange],
    );

    const displayError = error || internalError;

    return (
      <div className="file-input__wrapper">
        <input
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          type="file"
          className="file-input__input"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          {...props}
        />
        <div className="file-input__content">
          <Button
            variant={variant as any}
            size="sm"
            onClick={() => {
              inputRef.current?.click();
            }}
          >
            {buttonText}
          </Button>
          <span className="file-input__filename">
            {selectedFile ? selectedFile.name : "No file selected"}
          </span>
        </div>
        {displayError && <span className="file-input__error">{displayError}</span>}
      </div>
    );
  },
);

FileInput.displayName = "FileInput";

export { FileInput, fileInputVariants };
