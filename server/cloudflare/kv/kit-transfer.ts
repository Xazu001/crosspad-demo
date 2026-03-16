// ──────────────────────────────────────────────────────────────
// KitTransferManager - Kit Transfer Code Storage
// ──────────────────────────────────────────────────────────────
import type { KitTransferEntry } from "./types";

/** Transfer code TTL in seconds (7 days) */
const TRANSFER_CODE_TTL = 7 * 24 * 60 * 60;

/**
 * Manager for kit transfer codes.
 *
 * Stores transfer codes in KV namespace with 7-day TTL.
 * Follows the same pattern as TotpManager with prefixed keys.
 */
export class KitTransferManager {
  constructor(private kv: KVNamespace<string>) {}

  private getKey(code: string): string {
    return `transfer-kit:${code}`;
  }

  private getUserKey(userId: string): string {
    return `transfer-kit-user:${userId}`;
  }

  // ──────────────────────────────────────────────────────────────
  // Serialization
  // ──────────────────────────────────────────────────────────────

  private serialize(entry: KitTransferEntry): string {
    return JSON.stringify(entry);
  }

  private deserialize(raw: string): KitTransferEntry | null {
    try {
      const entry = JSON.parse(raw) as KitTransferEntry;

      if (entry._type !== "kit_transfer") {
        return null;
      }

      // Check expiration
      if (Date.now() > entry.expiresAt) {
        return null;
      }

      return entry;
    } catch {
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Transfer Code Operations
  // ──────────────────────────────────────────────────────────────

  /**
   * Create a new transfer code for a kit.
   * Returns the generated UUID code.
   */
  async createCode(
    kitId: number,
    kitName: string,
    userId: string,
    userName: string,
  ): Promise<string> {
    const code = crypto.randomUUID();
    const now = Date.now();

    const entry: KitTransferEntry = {
      _type: "kit_transfer",
      code,
      kitId,
      kitName,
      fromUserId: userId,
      fromUserName: userName,
      createdAt: now,
      expiresAt: now + TRANSFER_CODE_TTL * 1000,
    };

    try {
      // Store the transfer code entry
      const key = this.getKey(code);
      await this.kv.put(key, this.serialize(entry), {
        expirationTtl: TRANSFER_CODE_TTL,
      });

      // Add to user's list of codes
      await this.addToUserCodes(userId, code);

      return code;
    } catch (error) {
      console.error("[KitTransferManager] Create code failed:", error);
      throw error;
    }
  }

  /**
   * Get transfer entry by code.
   * Returns null if code doesn't exist or has expired.
   */
  async getCode(code: string): Promise<KitTransferEntry | null> {
    try {
      const key = this.getKey(code);
      const raw = await this.kv.get(key, "text");
      if (!raw) return null;
      return this.deserialize(raw);
    } catch (error) {
      console.error("[KitTransferManager] Get code failed:", error);
      return null;
    }
  }

  /**
   * Get transfer entry by kit ID.
   * Returns the active transfer code for a specific kit.
   */
  async getCodeByKitId(kitId: number, userId: string): Promise<KitTransferEntry | null> {
    try {
      const codes = await this.listUserCodes(userId);
      return codes.find((entry) => entry.kitId === kitId) ?? null;
    } catch (error) {
      console.error("[KitTransferManager] Get code by kit ID failed:", error);
      return null;
    }
  }

  /**
   * Delete a transfer code after use.
   */
  async deleteCode(code: string, userId?: string): Promise<void> {
    try {
      const key = this.getKey(code);
      await this.kv.delete(key);

      // Remove from user's list if userId provided
      if (userId) {
        await this.removeFromUserCodes(userId, code);
      }
    } catch (error) {
      console.error("[KitTransferManager] Delete code failed:", error);
    }
  }

  /**
   * List all active transfer codes for a user.
   */
  async listUserCodes(userId: string): Promise<KitTransferEntry[]> {
    try {
      const userKey = this.getUserKey(userId);
      const raw = await this.kv.get(userKey, "text");

      if (!raw) return [];

      const codeList = JSON.parse(raw) as string[];
      const entries: KitTransferEntry[] = [];

      // Fetch each code's entry
      for (const code of codeList) {
        const entry = await this.getCode(code);
        if (entry) {
          entries.push(entry);
        } else {
          // Clean up stale code from list
          await this.removeFromUserCodes(userId, code);
        }
      }

      return entries;
    } catch (error) {
      console.error("[KitTransferManager] List user codes failed:", error);
      return [];
    }
  }

  // ──────────────────────────────────────────────────────────────
  // User Code List Management
  // ──────────────────────────────────────────────────────────────

  private async addToUserCodes(userId: string, code: string): Promise<void> {
    try {
      const userKey = this.getUserKey(userId);
      const raw = await this.kv.get(userKey, "text");

      let codeList: string[] = [];
      if (raw) {
        codeList = JSON.parse(raw) as string[];
      }

      if (!codeList.includes(code)) {
        codeList.push(code);
        await this.kv.put(userKey, JSON.stringify(codeList), {
          expirationTtl: TRANSFER_CODE_TTL,
        });
      }
    } catch (error) {
      console.error("[KitTransferManager] Add to user codes failed:", error);
    }
  }

  private async removeFromUserCodes(userId: string, code: string): Promise<void> {
    try {
      const userKey = this.getUserKey(userId);
      const raw = await this.kv.get(userKey, "text");

      if (!raw) return;

      const codeList = JSON.parse(raw) as string[];
      const index = codeList.indexOf(code);

      if (index !== -1) {
        codeList.splice(index, 1);

        if (codeList.length > 0) {
          await this.kv.put(userKey, JSON.stringify(codeList), {
            expirationTtl: TRANSFER_CODE_TTL,
          });
        } else {
          // Delete empty list
          await this.kv.delete(userKey);
        }
      }
    } catch (error) {
      console.error("[KitTransferManager] Remove from user codes failed:", error);
    }
  }
}
