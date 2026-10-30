import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Encrypts provider access tokens before they are stored. The key lives only in
// the server environment (SOCIAL_TOKEN_KEY, 32 bytes, base64). Losing it means
// reconnecting every account, so keep a backup in your secrets manager.

const algorithm = "aes-256-gcm";
const ivBytes = 12;
const version = "v1";

export class TokenCryptoError extends Error {}

function loadKey(): Buffer {
  const encoded = process.env.SOCIAL_TOKEN_KEY;
  if (!encoded) {
    throw new TokenCryptoError("SOCIAL_TOKEN_KEY is not set on the server.");
  }

  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new TokenCryptoError("SOCIAL_TOKEN_KEY must decode to exactly 32 bytes.");
  }
  return key;
}

// Output format: v1:<iv>:<auth tag>:<ciphertext>, all base64.
export function encryptToken(plaintext: string, key: Buffer = loadKey()): string {
  const iv = randomBytes(ivBytes);
  const cipher = createCipheriv(algorithm, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [version, iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decryptToken(stored: string, key: Buffer = loadKey()): string {
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== version) {
    throw new TokenCryptoError("Stored token has an unknown format.");
  }

  const [, ivB64, tagB64, ciphertextB64] = parts;
  const decipher = createDecipheriv(algorithm, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  try {
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    // Do not say which part failed. A wrong key and a tampered value look the same.
    throw new TokenCryptoError("Stored token could not be decrypted.");
  }
}

export function generateTokenKey(): string {
  return randomBytes(32).toString("base64");
}
