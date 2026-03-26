import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const SENTINEL = 'ENC:';

function getDerivedKey(): Buffer {
  const secret = process.env.PAYMENT_ENCRYPTION_KEY || process.env.JWT_SECRET_KEY || 'meta-lingua-default-payment-encryption-key-32chars!!';
  return crypto.scryptSync(secret, 'meta-lingua-gateway-salt', 32);
}

export function encryptCredential(plaintext: string): string {
  if (!plaintext || plaintext.startsWith(SENTINEL)) return plaintext;
  const key = getDerivedKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString('base64');
  return `${SENTINEL}${payload}`;
}

export function decryptCredential(stored: string): string {
  if (!stored || !stored.startsWith(SENTINEL)) return stored;
  try {
    const key = getDerivedKey();
    const buf = Buffer.from(stored.slice(SENTINEL.length), 'base64');
    const iv = buf.slice(0, 12);
    const tag = buf.slice(12, 28);
    const ciphertext = buf.slice(28);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(ciphertext) + decipher.final('utf8');
  } catch {
    return '';
  }
}

export function isCredentialSet(stored: string | null | undefined): boolean {
  return !!stored && stored.length > 0;
}
