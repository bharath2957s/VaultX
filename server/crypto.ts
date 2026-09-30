import crypto from 'crypto';

// Master key from environment or 32-byte secure fallback
const MASTER_KEY_RAW = process.env.MASTER_ENCRYPTION_KEY || 'vaultx-master-secure-encryption-key-32b!';
const MASTER_KEY = crypto.createHash('sha256').update(MASTER_KEY_RAW).digest();
const JWT_SECRET = process.env.JWT_SECRET || 'vaultx-jwt-access-secret-token-key-64b-entropy!';

export interface EncryptedFileResult {
  ciphertext: Buffer;
  iv: string; // Hex
  authTag: string; // Hex
  fileKeyEncrypted: string; // Hex encrypted DEK
  sha256Original: string;
  sha256Encrypted: string;
}

/**
 * Generate a cryptographically secure random token (URL-safe base64 or alphanumeric)
 */
export function generateRandomToken(bytes = 20): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Calculate SHA-256 hash of a buffer
 */
export function calculateSha256(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Hash password with secure salt using PBKDF2 with 100,000 iterations and sha512
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

/**
 * Verify password against stored hash using constant-time comparison
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
      return false;
    }
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];
    const testHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Generate a random 256-bit Data Encryption Key (DEK)
 */
export function generateFileKey(): Buffer {
  return crypto.randomBytes(32);
}

/**
 * Encrypt a file buffer with AES-256-GCM using a unique per-file key
 */
export function encryptFile(buffer: Buffer): EncryptedFileResult {
  const fileKey = generateFileKey();
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
  
  const cipher = crypto.createCipheriv('aes-256-gcm', fileKey, iv);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Encrypt the per-file DEK with the master key using AES-256-GCM
  const dekIv = crypto.randomBytes(12);
  const dekCipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, dekIv);
  const encryptedDek = Buffer.concat([dekCipher.update(fileKey), dekCipher.final()]);
  const dekAuthTag = dekCipher.getAuthTag();
  const wrappedKey = `${dekIv.toString('hex')}:${dekAuthTag.toString('hex')}:${encryptedDek.toString('hex')}`;

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    fileKeyEncrypted: wrappedKey,
    sha256Original: calculateSha256(buffer),
    sha256Encrypted: calculateSha256(ciphertext)
  };
}

/**
 * Decrypt a file buffer with AES-256-GCM and verify authenticity
 */
export function decryptFile(
  ciphertext: Buffer,
  ivHex: string,
  authTagHex: string,
  wrappedKey: string
): { buffer: Buffer; sha256Verified: boolean; originalSha256: string } {
  // Unwrap DEK
  const [dekIvHex, dekAuthTagHex, encDekHex] = wrappedKey.split(':');
  const dekIv = Buffer.from(dekIvHex, 'hex');
  const dekAuthTag = Buffer.from(dekAuthTagHex, 'hex');
  const encDek = Buffer.from(encDekHex, 'hex');

  const dekDecipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, dekIv);
  dekDecipher.setAuthTag(dekAuthTag);
  const fileKey = Buffer.concat([dekDecipher.update(encDek), dekDecipher.final()]);

  // Decrypt File with DEK
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', fileKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  const calculatedSha = calculateSha256(decrypted);

  return {
    buffer: decrypted,
    sha256Verified: true,
    originalSha256: calculatedSha
  };
}

/**
 * Sign an access token with HMAC-SHA256
 */
export function signAccessToken(payload: Record<string, any>, expiresInSeconds = 3600): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
    jti: generateRandomToken(16)
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${b64Header}.${b64Payload}`)
    .digest('base64url');

  return `${b64Header}.${b64Payload}.${signature}`;
}

/**
 * Verify and decode an HMAC-SHA256 access token
 */
export function verifyAccessToken(token: string): { valid: boolean; payload?: any; reason?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'Malformed token structure' };
    }
    const [b64Header, b64Payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${b64Header}.${b64Payload}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, reason: 'Invalid cryptographic signature' };
    }

    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, reason: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, reason: err.message || 'Token verification error' };
  }
}
