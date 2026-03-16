// ──────────────────────────────────────────────────────────────
// Imports
// ──────────────────────────────────────────────────────────────
import { R2_URL } from "@/constants";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
type R2 = Cloudflare.Env["r2"];

/** Options for uploading a single file to R2 */
export interface UploadOptions {
  directory?: string;
  customName?: string;
  metadata?: Record<string, string>;
  contentType?: string;
}

/** Result details for an upload attempt */
export interface UploadResult {
  success: boolean;
  key: string;
  url?: string;
  error?: string;
  relativePath?: string;
}

/** Options for multi-file uploads */
export interface MultiUploadOptions extends UploadOptions {
  maxFiles?: number;
}

/** Result summary for multi-file uploads */
export interface MultiUploadResult {
  success: boolean;
  files: UploadResult[];
  errors?: string[];
}

// ──────────────────────────────────────────────────────────────
// R2 File Uploader
// ──────────────────────────────────────────────────────────────

/**
 * R2 file helper for uploading, listing, and deleting objects.
 *
 * Wraps Cloudflare R2 API calls with consistent return types and
 * basic validation. Use this for server-side file operations.
 */
export class R2FileUploader {
  private r2: R2;

  constructor(r2: R2) {
    this.r2 = r2;
  }

  /**
   * Upload a single file to R2.
   *
   * @param file - File object or ArrayBuffer payload
   * @param options - Upload configuration
   * @returns Upload result with URL on success
   */
  async uploadSingle(file: File | ArrayBuffer, options: UploadOptions = {}): Promise<UploadResult> {
    try {
      const { directory = "", customName, metadata = {}, contentType } = options;

      let fileName: string;
      if (file instanceof File) {
        fileName = customName || file.name;

        // Validate file
        if (file.size === 0) {
          throw new Error("File is empty");
        }

        if (file.size > 100 * 1024 * 1024) {
          // 100MB limit
          console.warn(`Large file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }
      } else {
        if (!customName) {
          throw new Error("customName is required when uploading ArrayBuffer");
        }
        fileName = customName;
      }

      const key = directory ? `${directory}/${fileName}`.replace(/\/+/g, "/") : fileName;

      let body: ArrayBuffer;
      if (file instanceof File) {
        body = await file.arrayBuffer();
      } else {
        body = file;
      }

      const object = await this.r2.put(key, body);

      if (!object) {
        return {
          success: false,
          key: "",
          error: "Failed to upload file to R2",
          relativePath: "",
        };
      }

      return {
        success: true,
        key: object.key,
        url: `${R2_URL}/${object.key}`,
        relativePath: object.key,
      };
    } catch (error) {
      return {
        success: false,
        key: "",
        error: error instanceof Error ? error.message : "Unknown error occurred",
        relativePath: "",
      };
    }
  }

  /**
   * Upload multiple files to R2 sequentially.
   *
   * Uses sequential uploads to avoid rate limiting. Enforces
   * a max file count per request.
   *
   * @param files - Array of files or buffers
   * @param options - Upload configuration
   * @returns Summary of upload results
   */
  async uploadMultiple(
    files: File[] | ArrayBuffer[],
    options: MultiUploadOptions = {},
  ): Promise<MultiUploadResult> {
    const { maxFiles = 10, ...uploadOptions } = options;

    if (files.length > maxFiles) {
      return {
        success: false,
        files: [],
        errors: [`Maximum ${maxFiles} files allowed per upload`],
      };
    }

    const results: UploadResult[] = [];
    const errors: string[] = [];

    // Upload files sequentially to avoid rate limiting
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.uploadSingle(file, uploadOptions);
      results.push(result);

      if (!result.success && result.error) {
        errors.push(`File ${i + 1}: ${result.error}`);
      }
    }

    const hasFailures = results.some((r) => !r.success);

    return {
      success: !hasFailures,
      files: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Delete a file from R2.
   *
   * @param key - R2 object key
   * @returns Success status
   */
  async delete(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.r2.delete(key);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete file",
      };
    }
  }

  /**
   * Get file metadata from R2.
   *
   * @param key - R2 object key
   * @returns Metadata payload when found
   */
  async getMetadata(
    key: string,
  ): Promise<{ success: boolean; metadata?: R2Object; error?: string }> {
    try {
      const object = await this.r2.head(key);

      if (!object) {
        return {
          success: false,
          error: "File not found",
        };
      }

      return {
        success: true,
        metadata: object,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get file metadata",
      };
    }
  }

  /**
   * List files in a directory prefix.
   *
   * @param prefix - Directory prefix to list
   * @returns Array of matching object keys
   */
  async listFiles(
    directory?: string,
    options: { limit?: number; continuation?: string } = {},
  ): Promise<{ success: boolean; files?: R2Object[]; error?: string }> {
    try {
      const prefix = directory ? `${directory}/` : "";
      const result = await this.r2.list({
        prefix,
        limit: options.limit,
        cursor: options.continuation,
      });

      return {
        success: true,
        files: result.objects,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list files",
      };
    }
  }
}
