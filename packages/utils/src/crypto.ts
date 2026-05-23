import { randomBytes, createHash, createCipheriv, createDecipheriv } from 'crypto';
import { nanoid } from 'nanoid';

export function generateId(length = 21): string {
  return nanoid(length);
}

export function generateRequestId(): string {
  return `req_${nanoid(16)}`;
}

export function generateSessionId(): string {
  return `sess_${nanoid(32)}`;
}

export function generateApiKey(): string {
  return `dap_${randomBytes(32).toString('hex')}`;
}

export function hashString(input: string, algorithm = 'sha256'): string {
  return createHash(algorithm).update(input).digest('hex');
}

export function generateRandomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

export function encrypt(text: string, key: string): string {
  const keyBuffer = Buffer.from(key.padEnd(32, '0').slice(0, 32));
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string, key: string): string {
  const keyBuffer = Buffer.from(key.padEnd(32, '0').slice(0, 32));
  const parts = encryptedText.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const [ivHex, authTagHex, encrypted] = parts as [string, string, string];
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function maskSensitiveData(data: string, visibleChars = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  const masked = '*'.repeat(Math.min(data.length - visibleChars * 2, 8));
  return `${start}${masked}${end}`;
}
