// ──────────────────────────────────────────────────────────────
// Imports
// ──────────────────────────────────────────────────────────────
import { decode as jpegDecode, encode as jpegEncode } from "@jsquash/jpeg";
import { decode as pngDecode, encode as pngEncode } from "@jsquash/png";
import resize from "@jsquash/resize";
import { decode as webpDecode, encode as webpEncode } from "@jsquash/webp";

// ──────────────────────────────────────────────────────────────
// Image Processing
// ──────────────────────────────────────────────────────────────

/**
 * Process and normalize images for Cloudflare Workers.
 *
 * Decodes WebP/JPEG/PNG input, resizes to fit within target dimensions
 * using contain mode (no cropping), centers on transparent background,
 * and re-encodes to the requested format.
 *
 * @param imageBuffer - Raw image buffer
 * @param options - Resize/format options
 * @returns Processed image buffer
 */
export async function processImageForWorkers(
  imageBuffer: ArrayBuffer,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "png" | "jpeg";
  } = {},
): Promise<ArrayBuffer> {
  const { width = 400, height = 400, quality = 90, format = "webp" } = options;

  try {
    let imageData;
    let inputFormat: "webp" | "png" | "jpeg" | "unknown" = "unknown";

    // Try to decode as WebP first (most likely from our client)
    try {
      imageData = await webpDecode(imageBuffer);
      inputFormat = "webp";
    } catch {
      // Try JPEG
      try {
        imageData = await jpegDecode(imageBuffer);
        inputFormat = "jpeg";
      } catch {
        // Try PNG
        try {
          imageData = await pngDecode(imageBuffer);
          inputFormat = "png";
        } catch (e) {
          throw new Error("Unsupported image format. Please use WebP, JPEG or PNG.");
        }
      }
    }

    // Optimization: If already target format and dimensions, return original
    if (inputFormat === format && imageData.width === width && imageData.height === height) {
      return imageBuffer;
    }

    // Resize to contain within target dimensions (fit entire image, no cropping)
    const scale = Math.min(width / imageData.width, height / imageData.height);
    const scaledWidth = Math.max(1, Math.round(imageData.width * scale));
    const scaledHeight = Math.max(1, Math.round(imageData.height * scale));

    const resizedImage = await resize(imageData, {
      width: scaledWidth,
      height: scaledHeight,
      fitMethod: "stretch",
      method: "lanczos3",
      premultiply: true,
      linearRGB: true,
    });

    // Create a transparent canvas at target dimensions and center the resized image
    const offsetX = Math.floor((width - scaledWidth) / 2);
    const offsetY = Math.floor((height - scaledHeight) / 2);
    const bytesPerPixel = 4;

    // Create transparent output buffer (RGBA with alpha = 0)
    const outputData = new Uint8ClampedArray(width * height * bytesPerPixel);

    // Copy resized image data to center of output
    for (let y = 0; y < scaledHeight; y++) {
      for (let x = 0; x < scaledWidth; x++) {
        const srcIdx = (y * scaledWidth + x) * bytesPerPixel;
        const dstIdx = ((offsetY + y) * width + (offsetX + x)) * bytesPerPixel;
        outputData[dstIdx] = resizedImage.data[srcIdx]; // R
        outputData[dstIdx + 1] = resizedImage.data[srcIdx + 1]; // G
        outputData[dstIdx + 2] = resizedImage.data[srcIdx + 2]; // B
        outputData[dstIdx + 3] = resizedImage.data[srcIdx + 3]; // A
      }
    }

    const resizedImageData = {
      width,
      height,
      data: outputData,
      colorSpace: "srgb" as any,
    };

    // Encode to the desired format
    if (format === "webp") {
      return await webpEncode(resizedImageData, { quality });
    } else if (format === "png") {
      return await pngEncode(resizedImageData);
    } else {
      return await jpegEncode(resizedImageData, { quality });
    }
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
}
