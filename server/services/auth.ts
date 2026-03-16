// ──────────────────────────────────────────────────────────────
// Imports
// ──────────────────────────────────────────────────────────────

import * as jose from "jose";

import { createClearSessionCookie, sessionCookie } from "$/lib/cookies";
import { dataMethod } from "$/lib/decorators";

import { BaseService } from "./base";

import type { Database } from "$/core";

// ──────────────────────────────────────────────────────────────
// Types & Cache
// ──────────────────────────────────────────────────────────────

/** JWT key pair configuration with version support for cache invalidation */
export type KeyPair = {
  privateKey: any;
  publicKey: any;
  algorithm: string;
  version?: string;
};

// Cache key pair to avoid repeated imports
let cachedKeyPair: KeyPair | null = null;
let keyPairPromise: Promise<KeyPair> | null = null;

/**
 * Generate or import JWT key pair with caching.
 *
 * Decodes base64-encoded keys and imports them for use with jose.
 * Uses caching with version-based invalidation to improve performance.
 *
 * @param algorithm - JWT signing algorithm (e.g., "RS256")
 * @param jwtPrivate - Base64-encoded private key
 * @param jwtPublic - Base64-encoded public key
 * @param version - Version string for cache invalidation
 * @returns Promise resolving to KeyPair instance
 * @throws Error if keys are not provided
 */
export async function getKeyPair(
  algorithm: string,
  jwtPrivate?: string,
  jwtPublic?: string,
  version?: string
): Promise<KeyPair> {
  // Invalidate cache if version changed
  if (cachedKeyPair && version && cachedKeyPair.version !== version) {
    cachedKeyPair = null;
    keyPairPromise = null;
  }

  // Return cached key pair if available
  if (cachedKeyPair) {
    return cachedKeyPair;
  }

  // Return existing promise if key pair is being loaded
  if (keyPairPromise) {
    return keyPairPromise;
  }

  // Load and parse keys
  keyPairPromise = (async () => {
    if (!jwtPrivate || !jwtPublic) {
      throw new Error(
        "[Auth] Both JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be provided"
      );
    }

    // Decode base64 keys
    const decodedPrivate = atob(jwtPrivate);
    const decodedPublic = atob(jwtPublic);

    // Import keys for jose
    const privateKey = await jose.importPKCS8(decodedPrivate, algorithm);
    const publicKey = await jose.importSPKI(decodedPublic, algorithm);

    const keyPair = { privateKey, publicKey, algorithm, version };

    // Cache and return
    cachedKeyPair = keyPair;
    keyPairPromise = null;
    return keyPair;
  })();

  return keyPairPromise;
}

// ──────────────────────────────────────────────────────────────
// AuthService
// ──────────────────────────────────────────────────────────────

/**
 * Handles authentication, JWT token management, and user session validation.
 *
 * Provides methods for creating tokens, verifying requests, and retrieving
 * user information from authenticated requests.
 */
export class AuthService extends BaseService {
  private keyPair: KeyPair;

  constructor(db: Database, keyPair: KeyPair) {
    super(db);
    this.keyPair = keyPair;
  }

  public async createToken(userId: string, noExpire?: boolean) {
    const jwt = new jose.SignJWT()
      .setSubject(userId)
      .setIssuer("crosspad")
      .setIssuedAt()
      .setProtectedHeader({ alg: this.keyPair.algorithm });

    // Set expiration based on token type
    if (noExpire) {
      jwt.setExpirationTime("5y"); // Long-lived for "remember me"
    } else {
      jwt.setExpirationTime("4h"); // Short-lived for security
    }

    return jwt.sign(this.keyPair.privateKey);
  }

  @dataMethod()
  public async verifyToken(token: string) {
    try {
      const { payload } = await jose.jwtVerify(token, this.keyPair.publicKey);

      if (!payload.sub || !payload.iat || !payload.exp) {
        return this.none();
      }

      return this.ok({
        userId: payload.sub,
      });
    } catch {
      return this.none();
    }
  }

  @dataMethod()
  public async verifyRequest(request: Request) {
    try {
      const cookieHeader = request.headers.get("Cookie");

      if (!cookieHeader) {
        return this.none();
      }

      let cookie;
      try {
        cookie = await sessionCookie.parse(cookieHeader);
      } catch {
        return this.none();
      }

      if (!cookie || !cookie.token) {
        return this.none();
      }

      const tokenResult = await this.verifyToken(cookie.token);

      if (!tokenResult?.userId) {
        return this.none();
      }

      return this.ok({
        userId: tokenResult.userId,
      });
    } catch {
      return this.none();
    }
  }

  @dataMethod()
  public async getUserFromRequest(request: Request) {
    const verifyRequest = await this.verifyRequest(request);

    if (!verifyRequest?.userId) {
      return this.none();
    }

    // Query user with their rights using a join
    const user = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("users")
        .leftJoin("user_rights", "user_rights.user_id", "users.user_id")
        .where("users.user_id", "=", verifyRequest.userId)
        .select([
          "users.user_id",
          "users.user_name",
          "users.user_namespace",
          "users.user_avatar_source",
          "users.user_verified",
          "users.user_status",
          "users.anonymization_requested_at",
          "user_rights.user_right_id",
          "user_rights.user_create_kit",
          "user_rights.user_admin",
        ])
        .executeTakeFirst()
    );

    // Admin override (SQLite stores booleans as 0/1)
    if (user?.user_admin === 1) {
      user.user_create_kit = 1;
    }

    if (!user) {
      return this.none();
    }

    return this.ok(user);
  }

  /** Clear session cookie */
  public async clearSessionCookie(request: Request) {
    return await createClearSessionCookie(request);
  }
}
