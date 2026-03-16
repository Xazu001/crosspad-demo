// ──────────────────────────────────────────────────────────────
// Password Hashing Configuration
// ──────────────────────────────────────────────────────────────
// PBKDF2 parameters for secure password hashing
const ITERATIONS = 100000; // High iteration count for security
const HASH_LENGTH = 32; // 256-bit hash length
const SALT_LENGTH = 16; // 128-bit salt length

// ──────────────────────────────────────────────────────────────
// Password Hashing Functions
// ──────────────────────────────────────────────────────────────

/**
 * Hash a password using PBKDF2 with a random salt.
 *
 * Uses Web Crypto API for secure, platform-independent hashing.
 * The salt is embedded in the output for easy verification.
 *
 * @param password - Plain-text password to hash
 * @returns Promise resolving to base64-encoded salt+hash combination
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();

  // Generate random salt for each password
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  // Derive hash using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    HASH_LENGTH * 8, // Convert bytes to bits
  );

  const hashArray = new Uint8Array(hashBuffer);

  // Combine salt and hash for storage
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  // Return as base64 for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify a password against a stored hash.
 *
 * Extracts the salt from the stored hash and recomputes the hash
 * with the provided password. Uses constant-time comparison to prevent timing attacks.
 *
 * @param password - Plain-text password to verify
 * @param storedHash - Base64-encoded salt+hash from hashPassword()
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();

    // Decode stored hash and extract salt and hash
    const combined = Uint8Array.from(atob(storedHash), (c) => c.charCodeAt(0));
    const salt = combined.slice(0, SALT_LENGTH);
    const hash = combined.slice(SALT_LENGTH);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );

    // Derive hash with same parameters
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      HASH_LENGTH * 8,
    );

    const newHash = new Uint8Array(hashBuffer);

    // Length check prevents length extension attacks
    if (hash.length !== newHash.length) {
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    // XOR all bytes and check if result is zero
    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      result |= hash[i] ^ newHash[i];
    }

    return result === 0;
  } catch (error) {
    // Any error means verification failed
    return false;
  }
}
