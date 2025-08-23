import crypto from 'crypto';
import { env } from '@/lib/config/env';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 64; // Length of salt in bytes
const TAG_LENGTH = 16; // Length of tag in bytes
const ITERATIONS = 100000; // Number of iterations for key derivation

/**
 * Derives an encryption key from the master secret
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(env.NEXTAUTH_SECRET, salt, ITERATIONS, 32, 'sha256');
}

/**
 * Encrypts text using AES-256-GCM
 * @param text The text to encrypt
 * @returns Object containing encrypted text, IV, auth tag, and salt
 */
export function encrypt(text: string): {
  encrypted: string;
  iv: string;
  authTag: string;
  salt: string;
} {
  // Generate random salt for this encryption
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  // Derive key from master secret and salt
  const key = deriveKey(salt);
  
  // Generate random initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get the authentication tag
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    salt: salt.toString('hex')
  };
}

/**
 * Decrypts text encrypted with AES-256-GCM
 * @param encryptedData Object containing encrypted text, IV, auth tag, and salt
 * @returns Decrypted text
 */
export function decrypt(encryptedData: {
  encrypted: string;
  iv: string;
  authTag: string;
  salt: string;
}): string {
  // Convert from hex strings to buffers
  const salt = Buffer.from(encryptedData.salt, 'hex');
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');
  
  // Derive the same key using the salt
  const key = deriveKey(salt);
  
  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  // Set the authentication tag
  decipher.setAuthTag(authTag);
  
  // Decrypt the text
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Combines encryption data into a single string for storage
 * Format: salt:iv:authTag:encrypted
 */
export function packEncryptedData(data: {
  encrypted: string;
  iv: string;
  authTag: string;
  salt: string;
}): { content: string; iv: string } {
  // Store salt, authTag, and encrypted content together
  const packed = `${data.salt}:${data.authTag}:${data.encrypted}`;
  return {
    content: packed,
    iv: data.iv // Store IV separately for indexing/searching purposes if needed
  };
}

/**
 * Unpacks encrypted data from storage format
 */
export function unpackEncryptedData(content: string, iv: string): {
  encrypted: string;
  iv: string;
  authTag: string;
  salt: string;
} {
  const [salt, authTag, encrypted] = content.split(':');
  return {
    encrypted,
    iv,
    authTag,
    salt
  };
}

/**
 * Hashes text for searching purposes (one-way)
 */
export function hashForSearch(text: string): string {
  return crypto
    .createHash('sha256')
    .update(text.toLowerCase())
    .digest('hex');
}

/**
 * Calculates word count from text
 */
export function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Estimates reading time in minutes
 */
export function calculateReadingTime(wordCount: number): number {
  const WORDS_PER_MINUTE = 200; // Average reading speed
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
