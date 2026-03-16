import { ACCEPTED_IMAGE_TYPES, IMAGE_MAX_DIMENSION, IMAGE_QUALITY } from "@/utils/image";

// ──────────────────────────────────────────────────────────────
// Image Optimization Utilities
// ──────────────────────────────────────────────────────────────

/**
 * Check if a file is an accepted image type
 * Also checks file extension as fallback (browsers may not set correct MIME type for SVGs)
 */
const isAcceptedImageType = (file: File) => {
  if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return true;
  }
  // Fallback: check extension for SVG (browsers often send empty/incorrect MIME type)
  const ext = file.name.toLowerCase().split(".").pop();
  return ext === "svg";
};

/**
 * Resize an image to fit within MAX_DIMENSION (400px) while maintaining aspect ratio.
 * Converts all images to WebP format for better compression.
 * Handles SVG files by converting them to raster images.
 */
const resizeImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // SVG files need special handling - convert to raster first
    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

    if (isSvg) {
      // Read SVG as text and convert to data URL for Image loading
      const reader = new FileReader();
      reader.onload = (e) => {
        const svgText = e.target?.result as string;
        const img = new Image();
        img.onload = () => processImage(img);
        img.onerror = () => reject(new Error("Could not load SVG"));
        // Use encodeURIComponent for UTF-8 safe data URL (btoa fails on non-ASCII)
        img.src = `data:image/svg+xml,${encodeURIComponent(svgText)}`;
      };
      reader.onerror = () => reject(new Error("Could not read SVG file"));
      reader.readAsText(file);
    } else {
      // Load regular image directly
      const img = new Image();
      img.onload = () => processImage(img);
      img.onerror = () => {
        // If image fails to load, return original file (server will handle it)
        resolve(file);
      };
      img.src = URL.createObjectURL(file);
    }

    function processImage(img: HTMLImageElement) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      // Always create a 1:1 square canvas at MAX_DIMENSION
      canvas.width = IMAGE_MAX_DIMENSION;
      canvas.height = IMAGE_MAX_DIMENSION;

      // Calculate scaled dimensions to fit (contain) within the square
      const scale = Math.min(IMAGE_MAX_DIMENSION / img.width, IMAGE_MAX_DIMENSION / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Center the image on the canvas (transparent background)
      const offsetX = (IMAGE_MAX_DIMENSION - scaledWidth) / 2;
      const offsetY = (IMAGE_MAX_DIMENSION - scaledHeight) / 2;

      // Clear canvas (transparent) and draw centered image
      ctx.clearRect(0, 0, IMAGE_MAX_DIMENSION, IMAGE_MAX_DIMENSION);
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      // Convert to WebP blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const optimizedFile = new File([blob], fileName, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(optimizedFile);
          } else {
            // If resize fails, return original file
            resolve(file);
          }
        },
        "image/webp",
        IMAGE_QUALITY,
      );
    }
  });
};

/**
 * Optimize a logo image file
 * - Validates file type
 * - Resizes to max 400px while maintaining aspect ratio
 * - Converts to WebP
 */
export const optimizeLogoImage = async (file: File): Promise<File> => {
  // Check if file is an accepted image type
  if (!isAcceptedImageType(file)) {
    throw new Error(`Invalid file type. Accepted types: ${ACCEPTED_IMAGE_TYPES.join(", ")}`);
  }

  // Always run resizeImage to ensure WebP conversion and max dimensions
  return resizeImage(file);
};
