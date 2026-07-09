import { hash, verify } from "@node-rs/argon2";

// Argon2id per OWASP recommendation (over bcrypt) — memoryCost/timeCost tuned
// for a reasonable hash time on typical serverless hardware (~50-100ms).
const HASH_OPTIONS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export async function hashPassword(plaintext: string): Promise<string> {
  return hash(plaintext, HASH_OPTIONS);
}

export async function verifyPassword(
  hashed: string,
  plaintext: string
): Promise<boolean> {
  try {
    return await verify(hashed, plaintext, HASH_OPTIONS);
  } catch {
    // Malformed hash or verification error — treat as failed auth, never throw
    // up to the caller (a thrown error here could leak timing/state info).
    return false;
  }
}
