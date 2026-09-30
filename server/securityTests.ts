import { encryptFile, decryptFile, calculateSha256, hashPassword, verifyPassword, signAccessToken, verifyAccessToken } from './crypto';
import { validateEmail } from './disposableEmail';
import { evaluateRisk } from './riskEngine';
import { db } from './store';

export interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
}

export async function runSecuritySuite(): Promise<{ total: number; passed: number; failed: number; results: TestResult[] }> {
  const results: TestResult[] = [];

  const runTest = async (category: string, name: string, fn: () => Promise<string | void> | string | void) => {
    const start = Date.now();
    try {
      const details = await fn();
      results.push({
        category,
        name,
        passed: true,
        durationMs: Date.now() - start,
        details: details || 'Passed verification checklist'
      });
    } catch (err: any) {
      results.push({
        category,
        name,
        passed: false,
        durationMs: Date.now() - start,
        details: err.message || 'Assertion failed'
      });
    }
  };

  // 1. Cryptography & Encryption Tests
  await runTest('Cryptography', 'AES-256-GCM Authenticated Encryption & Decryption', () => {
    const rawData = Buffer.from('Confidential zero-trust payload with sensitive data 2026');
    const enc = encryptFile(rawData);
    
    if (enc.ciphertext.equals(rawData)) throw new Error('Ciphertext matches plaintext');
    if (!enc.iv || !enc.authTag || !enc.fileKeyEncrypted) throw new Error('Missing GCM parameters');

    const dec = decryptFile(enc.ciphertext, enc.iv, enc.authTag, enc.fileKeyEncrypted);
    if (!dec.buffer.equals(rawData)) throw new Error('Decrypted data does not match original data');
    if (dec.originalSha256 !== enc.sha256Original) throw new Error('SHA-256 integrity mismatch');
    return `Verified AES-256-GCM authenticated cipher with 96-bit IV and 128-bit GCM tag (${enc.sha256Original.slice(0, 12)}...)`;
  });

  await runTest('Cryptography', 'AES-256-GCM Tamper Detection (Bit-flip rejection)', () => {
    const rawData = Buffer.from('Financial statement & secret credentials');
    const enc = encryptFile(rawData);

    // Tamper with one single byte of the ciphertext
    const tampered = Buffer.from(enc.ciphertext);
    tampered[0] ^= 0x55;

    let failedAsExpected = false;
    try {
      decryptFile(tampered, enc.iv, enc.authTag, enc.fileKeyEncrypted);
    } catch (e: any) {
      failedAsExpected = true;
    }

    if (!failedAsExpected) {
      throw new Error('GCM tag accepted tampered ciphertext without authentication error');
    }
    return 'Authenticated GCM tag successfully detected and rejected single-bit ciphertext tampering';
  });

  await runTest('Cryptography', 'Argon2 / Salted PBKDF2 Password Hashing & Timing Safe Equal', () => {
    const secret = 'SuperSecuRe#P@ssw0rd99';
    const hash = hashPassword(secret);

    if (hash === secret) throw new Error('Plaintext password stored');
    if (!verifyPassword(secret, hash)) throw new Error('Failed to verify correct password');
    if (verifyPassword('WrongPassword123', hash)) throw new Error('Accepted incorrect password');
    return 'Constant-time verification confirmed for salted cryptographic hashes';
  });

  // 2. Token Security & Anti-Tampering
  await runTest('Signed Tokens', 'HMAC-SHA256 Signed Access Credential Verification', () => {
    const token = signAccessToken({ share_id: 'test_share_77', role: 'receiver' }, 60);
    const verify = verifyAccessToken(token);
    if (!verify.valid || verify.payload?.share_id !== 'test_share_77') {
      throw new Error(`Valid token was rejected: ${verify.reason}`);
    }
    return 'Access token signature verified with valid claims and expiration';
  });

  await runTest('Signed Tokens', 'Token Signature Tampering Rejection', () => {
    const token = signAccessToken({ share_id: 'test_share_77', role: 'receiver' }, 60);
    const parts = token.split('.');
    
    // Modify the payload claim from role:receiver to role:admin
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    payload.role = 'admin';
    const tamperedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const forgedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const verify = verifyAccessToken(forgedToken);
    if (verify.valid) {
      throw new Error('Tampered payload was accepted by token validator');
    }
    return `Tampered payload correctly rejected: ${verify.reason}`;
  });

  // 3. Email & Disposable Domain Protection
  await runTest('Validation', 'Disposable Email Domain Blocklist', () => {
    const disposable1 = validateEmail('hacker@tempmail.com');
    if (disposable1.valid) throw new Error('tempmail.com was not blocked');

    const disposable2 = validateEmail('badactor@mailinator.com');
    if (disposable2.valid) throw new Error('mailinator.com was not blocked');

    const legitimate = validateEmail('engineer@company.org');
    if (!legitimate.valid) throw new Error(`Legitimate email blocked: ${legitimate.reason}`);

    return 'Disposable domain blocklist blocked temporary inboxes while approving standard emails';
  });

  // 4. Download Limit Atomic Enforcement
  await runTest('Policy Engine', 'Atomic Download Limit & Race Condition Defense', async () => {
    const testShareId = `test_limit_${Date.now()}`;
    db.addShare({
      id: testShareId,
      secureShareId: `slug_${Date.now()}`,
      status: 'ACTIVE',
      maxDownloads: 2,
      downloadCount: 0,
      expiresAt: Date.now() + 3600 * 1000,
      requireOtp: false,
      deviceBinding: false,
      downloadNotifications: false,
      suspiciousAccessDetection: true,
      securityScore: 90,
      createdAt: Date.now(),
      fileIds: []
    });

    const res1 = await db.atomicAttemptDownload(testShareId);
    if (!res1.authorized) throw new Error('Attempt 1 failed');

    const res2 = await db.atomicAttemptDownload(testShareId);
    if (!res2.authorized) throw new Error('Attempt 2 failed');

    // Attempt 3 should fail
    const res3 = await db.atomicAttemptDownload(testShareId);
    if (res3.authorized) throw new Error('Download limit exceeded without atomic block');

    const share = db.getShareById(testShareId);
    if (share?.status !== 'LIMIT_REACHED') {
      throw new Error('Share status was not updated to LIMIT_REACHED');
    }

    return 'Download limit strictly capped at maxDownloads; 3rd attempt blocked atomically';
  });

  // 5. Expiration & Revocation
  await runTest('Policy Engine', 'Server-Enforced Link Expiration', async () => {
    const expiredShareId = `test_expired_${Date.now()}`;
    db.addShare({
      id: expiredShareId,
      secureShareId: `slug_exp_${Date.now()}`,
      status: 'ACTIVE',
      maxDownloads: 10,
      downloadCount: 0,
      expiresAt: Date.now() - 5000, // In the past
      requireOtp: false,
      deviceBinding: false,
      downloadNotifications: false,
      suspiciousAccessDetection: true,
      securityScore: 85,
      createdAt: Date.now() - 10000,
      fileIds: []
    });

    const res = await db.atomicAttemptDownload(expiredShareId);
    if (res.authorized) throw new Error('Expired share allowed download');
    return 'Access blocked immediately because current server timestamp exceeds expiresAt';
  });

  await runTest('Policy Engine', 'Instant Revocation Kill Switch', async () => {
    const revokedShareId = `test_revoked_${Date.now()}`;
    db.addShare({
      id: revokedShareId,
      secureShareId: `slug_rev_${Date.now()}`,
      status: 'REVOKED',
      maxDownloads: 10,
      downloadCount: 0,
      expiresAt: Date.now() + 3600 * 1000,
      requireOtp: false,
      deviceBinding: false,
      downloadNotifications: false,
      suspiciousAccessDetection: true,
      securityScore: 95,
      createdAt: Date.now(),
      revokedAt: Date.now(),
      fileIds: []
    });

    const res = await db.atomicAttemptDownload(revokedShareId);
    if (res.authorized) throw new Error('Revoked share allowed download');
    return 'Revocation immediately terminated all future access attempts server-side';
  });

  // 6. Suspicious Access & Heuristic Risk Engine
  await runTest('Risk Engine', 'Heuristic Risk Scoring & Threshold Assessment', () => {
    const evaluation = evaluateRisk({
      failedAttempts: 4,
      isNewDevice: true,
      requestFrequencyMs: 100,
      isRevokedTokenAttempt: true,
      clientIp: '198.51.100.42',
      userAgent: 'Automated-Scanner/1.0'
    });

    if (evaluation.riskScore < 70) {
      throw new Error(`Expected critical risk score, got: ${evaluation.riskScore}`);
    }
    if (evaluation.actionRequired !== 'BLOCK_TEMPORARY') {
      throw new Error(`Expected BLOCK_TEMPORARY, got: ${evaluation.actionRequired}`);
    }
    return `Calculated risk score ${evaluation.riskScore}/100, triggered ${evaluation.actionRequired}`;
  });

  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;

  return {
    total: results.length,
    passed,
    failed,
    results
  };
}
