/**
 * Disposable email domain blocker & email syntax validator
 */

const BLOCKED_DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'yopmail.com',
  'getairmail.com',
  'dispostable.com',
  'sharklasers.com',
  'trashmail.com',
  'maildrop.cc',
  'fakemailgenerator.com',
  'mytemp.email',
  'mohmal.com',
  'emailondeck.com',
  'crazymailing.com',
  'tmail.com'
]);

export function validateEmail(email: string): { valid: boolean; reason?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, reason: 'Invalid email address format' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Invalid domain syntax' };
  }

  const domain = parts[1];
  if (BLOCKED_DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: `Disposable/temporary email domains (${domain}) are prohibited for security` };
  }

  return { valid: true };
}
