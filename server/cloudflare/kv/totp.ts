// ──────────────────────────────────────────────────────────────
// TotpManager - TOTP Secret & Backup Code Storage
// ──────────────────────────────────────────────────────────────
import type { TotpBackupEntry, TotpSecretEntry } from "./types";

/**
 * Manager for TOTP (Time-based One-Time Password) secrets and backup codes.
 *
 * Stores encrypted TOTP secrets and backup codes in KV namespace.
 * Follows the same pattern as CacheManager with prefixed keys.
 */
export class TotpManager {
  constructor(private kv: KVNamespace<string>) {}

  private getSecretKey(userId: string): string {
    return `totp:${userId}`;
  }

  private getBackupKey(userId: string): string {
    return `totp_backup:${userId}`;
  }

  // ──────────────────────────────────────────────────────────────
  // Secret Operations
  // ──────────────────────────────────────────────────────────────

  private serializeSecret(encryptedSecret: string): string {
    const entry: TotpSecretEntry = {
      _type: "totp_secret",
      encryptedSecret,
      createdAt: Date.now(),
    };
    return JSON.stringify(entry);
  }

  private deserializeSecret(raw: string): string | null {
    try {
      const entry = JSON.parse(raw) as TotpSecretEntry;

      if (entry._type !== "totp_secret") {
        return null;
      }

      return entry.encryptedSecret;
    } catch {
      return null;
    }
  }

  /** Store an encrypted TOTP secret for a user */
  async setSecret(userId: string, encryptedSecret: string): Promise<void> {
    try {
      const key = this.getSecretKey(userId);
      const serialized = this.serializeSecret(encryptedSecret);
      await this.kv.put(key, serialized);
    } catch (error) {
      console.error("[TotpManager] Set secret failed:", error);
      throw error;
    }
  }

  /** Get the encrypted TOTP secret for a user */
  async getSecret(userId: string): Promise<string | null> {
    try {
      const key = this.getSecretKey(userId);
      const raw = await this.kv.get(key, "text");
      if (!raw) return null;
      return this.deserializeSecret(raw);
    } catch (error) {
      console.error("[TotpManager] Get secret failed:", error);
      return null;
    }
  }

  /** Delete the TOTP secret for a user */
  async deleteSecret(userId: string): Promise<void> {
    try {
      const key = this.getSecretKey(userId);
      await this.kv.delete(key);
    } catch (error) {
      console.error("[TotpManager] Delete secret failed:", error);
    }
  }

  /** Check if a user has TOTP enabled (has a secret stored) */
  async hasSecret(userId: string): Promise<boolean> {
    const secret = await this.getSecret(userId);
    return secret !== null;
  }

  // ──────────────────────────────────────────────────────────────
  // Backup Code Operations
  // ──────────────────────────────────────────────────────────────

  private serializeBackupCodes(codes: string[]): string {
    const entry: TotpBackupEntry = {
      _type: "totp_backup",
      codes,
      createdAt: Date.now(),
    };
    return JSON.stringify(entry);
  }

  private deserializeBackupCodes(raw: string): string[] | null {
    try {
      const entry = JSON.parse(raw) as TotpBackupEntry;

      if (entry._type !== "totp_backup") {
        return null;
      }

      return entry.codes;
    } catch {
      return null;
    }
  }

  /** Store backup codes for a user */
  async setBackupCodes(userId: string, codes: string[]): Promise<void> {
    try {
      const key = this.getBackupKey(userId);
      const serialized = this.serializeBackupCodes(codes);
      await this.kv.put(key, serialized);
    } catch (error) {
      console.error("[TotpManager] Set backup codes failed:", error);
      throw error;
    }
  }

  /** Get backup codes for a user */
  async getBackupCodes(userId: string): Promise<string[] | null> {
    try {
      const key = this.getBackupKey(userId);
      const raw = await this.kv.get(key, "text");
      if (!raw) return null;
      return this.deserializeBackupCodes(raw);
    } catch (error) {
      console.error("[TotpManager] Get backup codes failed:", error);
      return null;
    }
  }

  /**
   * Consume a backup code (remove it from the list after use).
   * Returns true if the code was valid and consumed, false otherwise.
   */
  async consumeBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const codes = await this.getBackupCodes(userId);
      if (!codes) return false;

      const codeIndex = codes.indexOf(code);
      if (codeIndex === -1) return false;

      // Remove the used code
      codes.splice(codeIndex, 1);

      // Update the stored codes
      await this.setBackupCodes(userId, codes);
      return true;
    } catch (error) {
      console.error("[TotpManager] Consume backup code failed:", error);
      return false;
    }
  }

  /** Delete all backup codes for a user */
  async deleteBackupCodes(userId: string): Promise<void> {
    try {
      const key = this.getBackupKey(userId);
      await this.kv.delete(key);
    } catch (error) {
      console.error("[TotpManager] Delete backup codes failed:", error);
    }
  }

  /** Delete all TOTP data (secret + backup codes) for a user */
  async deleteAll(userId: string): Promise<void> {
    await Promise.all([this.deleteSecret(userId), this.deleteBackupCodes(userId)]);
  }
}
