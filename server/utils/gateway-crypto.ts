import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const SENTINEL = 'ENC:';

let _key: Buffer | null = null;

function getDerivedKey(): Buffer {
  if (_key) return _key;

  const secret = process.env.PAYMENT_ENCRYPTION_KEY
    ?? process.env.JWT_SECRET_KEY
    ?? process.env.JWT_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error(
      'PAYMENT_ENCRYPTION_KEY (or JWT_SECRET) environment variable is required to encrypt payment credentials. ' +
      'Set PAYMENT_ENCRYPTION_KEY to a random 32+ character string in your .env / docker-compose environment.'
    );
  }

  _key = crypto.scryptSync(secret, 'meta-lingua-gateway-salt-v1', 32);
  return _key;
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
  if (!stored) return '';
  if (!stored.startsWith(SENTINEL)) return stored;
  try {
    const key = getDerivedKey();
    const buf = Buffer.from(stored.slice(SENTINEL.length), 'base64');
    const iv = buf.slice(0, 12);
    const tag = buf.slice(12, 28);
    const ciphertext = buf.slice(28);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(ciphertext) + decipher.final('utf8');
  } catch (err) {
    console.error('Failed to decrypt gateway credential — credential may be corrupted or key changed:', err);
    return '';
  }
}

export function isCredentialSet(stored: string | null | undefined): boolean {
  return !!stored && stored.length > 0;
}
