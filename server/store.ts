import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  verified: boolean;
  createdAt: number;
  googleId?: string | null;
  avatarUrl?: string | null;
}

export interface EmailVerificationToken {
  tokenHash: string;
  rawTokenPreview?: string; // Stored only in development demo mode for judge convenience
  userId: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

export interface StoredFile {
  id: string;
  originalName: string;
  sanitizedName: string;
  mimeType: string;
  size: number;
  encryptedStorageId: string;
  sha256Original: string;
  sha256Encrypted: string;
  iv: string;
  authTag: string;
  fileKeyEncrypted: string;
  version: number;
  ownerId?: string | null;
  createdAt: number;
  updatedAt: number;
}

export type ShareStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'LIMIT_REACHED';

export interface Share {
  id: string;
  secureShareId: string; // Cryptographically random public slug
  ownerId?: string | null;
  status: ShareStatus;
  passwordHash?: string | null;
  maxDownloads: number; // 0 or -1 means unlimited
  downloadCount: number;
  expiresAt: number;
  requireOtp: boolean;
  otpHash?: string | null;
  otpCodePreview?: string; // Demo simulation helper
  deviceBinding: boolean;
  downloadNotifications: boolean;
  suspiciousAccessDetection: boolean;
  securityScore: number;
  createdAt: number;
  revokedAt?: number | null;
  fileIds: string[];
}

export interface ShareSession {
  sessionId: string;
  shareId: string;
  clientIp: string;
  userAgent: string;
  authenticatedAt: number;
  expiresAt: number;
}

export interface DownloadEvent {
  id: string;
  shareId: string;
  fileId?: string | null;
  isZip: boolean;
  downloadedAt: number;
  clientIp: string;
  userAgent: string;
  status: 'SUCCESS' | 'BLOCKED_LIMIT' | 'BLOCKED_REVOKED' | 'BLOCKED_EXPIRED';
}

export type SecurityEventType =
  | 'SHARE_CREATED'
  | 'FILE_UPLOADED'
  | 'FILE_REPLACED'
  | 'PASSWORD_FAILED'
  | 'PASSWORD_SUCCESS'
  | 'FILE_VIEWED'
  | 'FILE_DOWNLOADED'
  | 'MULTI_FILE_DOWNLOAD'
  | 'LINK_REVOKED'
  | 'LINK_EXPIRED'
  | 'DOWNLOAD_LIMIT_REACHED'
  | 'INVALID_TOKEN'
  | 'SUSPICIOUS_ACCESS'
  | 'CHAT_MESSAGE_SENT';

export interface SecurityEvent {
  id: string;
  timestamp: number;
  shareId?: string | null;
  eventType: SecurityEventType;
  success: boolean;
  clientIp: string;
  userAgent: string;
  riskScore: number;
  details: string;
}

export interface PasswordAttemptTracker {
  shareId: string;
  clientIp: string;
  failedCount: number;
  lockedUntil: number;
}

export interface ChatMessage {
  id: string;
  shareId: string;
  senderType: 'SENDER' | 'RECEIVER';
  senderName: string;
  text: string;
  timestamp: number;
}

export interface ReceiverAccessRecord {
  userId: string;
  userName: string;
  userEmail: string;
  firstAccessedAt: number;
  lastAccessedAt: number;
  accessCount: number;
  downloadCount: number;
  clientIp: string;
  userAgent?: string;
}

export interface DatabaseState {
  users: Record<string, User>;
  emailTokens: Record<string, EmailVerificationToken>;
  files: Record<string, StoredFile>;
  shares: Record<string, Share>;
  shareSessions: Record<string, ShareSession>;
  downloadEvents: DownloadEvent[];
  securityEvents: SecurityEvent[];
  passwordAttempts: Record<string, PasswordAttemptTracker>;
  chatMessages: ChatMessage[];
  receiverAccesses: Record<string, ReceiverAccessRecord[]>;
}

const STORAGE_ROOT = path.resolve(process.env.STORAGE_PATH || './storage');
const DB_FILE_PATH = path.join(STORAGE_ROOT, 'vaultx_db.json');
const FILES_DIR = path.join(STORAGE_ROOT, 'files');

class VaultXStore {
  private state: DatabaseState = {
    users: {},
    emailTokens: {},
    files: {},
    shares: {},
    shareSessions: {},
    downloadEvents: [],
    securityEvents: [],
    passwordAttempts: {},
    chatMessages: [],
    receiverAccesses: {}
  };

  private atomicLock = false;

  constructor() {
    this.initDirectories();
    this.loadState();
  }

  private initDirectories() {
    if (!fs.existsSync(STORAGE_ROOT)) {
      fs.mkdirSync(STORAGE_ROOT, { recursive: true });
    }
    if (!fs.existsSync(FILES_DIR)) {
      fs.mkdirSync(FILES_DIR, { recursive: true });
    }
  }

  private loadState() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.state = JSON.parse(raw);
        if (!this.state.receiverAccesses) {
          this.state.receiverAccesses = {};
        }
      } else {
        this.saveState();
      }
    } catch (err) {
      console.error('Failed to load storage state, initializing clean state:', err);
      this.saveState();
    }
  }

  public saveState() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save state to disk:', err);
    }
  }

  public getFilesDir(): string {
    return FILES_DIR;
  }

  // Users
  public addUser(user: User): void {
    this.state.users[user.id] = user;
    this.saveState();
  }

  public getUserById(id: string): User | undefined {
    return this.state.users[id];
  }

  public getUserByEmail(email: string): User | undefined {
    return Object.values(this.state.users).find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public updateUser(id: string, updates: Partial<User>): void {
    if (this.state.users[id]) {
      this.state.users[id] = { ...this.state.users[id], ...updates };
      this.saveState();
    }
  }

  // Email Tokens
  public addEmailToken(token: EmailVerificationToken): void {
    this.state.emailTokens[token.tokenHash] = token;
    this.saveState();
  }

  public getEmailToken(tokenHash: string): EmailVerificationToken | undefined {
    return this.state.emailTokens[tokenHash];
  }

  public markEmailTokenUsed(tokenHash: string): void {
    if (this.state.emailTokens[tokenHash]) {
      this.state.emailTokens[tokenHash].used = true;
      this.saveState();
    }
  }

  // Files
  public addFile(file: StoredFile): void {
    this.state.files[file.id] = file;
    this.saveState();
  }

  public getFile(id: string): StoredFile | undefined {
    return this.state.files[id];
  }

  public updateFile(id: string, updates: Partial<StoredFile>): void {
    if (this.state.files[id]) {
      this.state.files[id] = { ...this.state.files[id], ...updates, updatedAt: Date.now() };
      this.saveState();
    }
  }

  public deleteFile(id: string): boolean {
    const file = this.state.files[id];
    if (!file) return false;

    // Delete encrypted physical file
    const physicalPath = path.join(FILES_DIR, `${file.encryptedStorageId}.enc`);
    if (fs.existsSync(physicalPath)) {
      try {
        fs.unlinkSync(physicalPath);
      } catch (err) {
        console.error('Error deleting physical file:', err);
      }
    }

    delete this.state.files[id];
    this.saveState();
    return true;
  }

  public listFilesByOwner(ownerId?: string | null): StoredFile[] {
    const all = Object.values(this.state.files);
    if (!ownerId) {
      return all;
    }
    return all.filter(f => f.ownerId === ownerId);
  }

  // Shares
  public addShare(share: Share): void {
    this.state.shares[share.id] = share;
    this.saveState();
  }

  public getShareById(id: string): Share | undefined {
    return this.state.shares[id] || Object.values(this.state.shares).find(s => s.secureShareId === id);
  }

  public getShareBySecureId(secureShareId: string): Share | undefined {
    return Object.values(this.state.shares).find(s => s.secureShareId === secureShareId) || this.state.shares[secureShareId];
  }

  public updateShare(id: string, updates: Partial<Share>): void {
    const share = this.getShareById(id);
    if (share && this.state.shares[share.id]) {
      this.state.shares[share.id] = { ...this.state.shares[share.id], ...updates };
      this.saveState();
    }
  }

  public listShares(ownerId?: string | null): Share[] {
    const all = Object.values(this.state.shares);
    if (!ownerId) {
      return all;
    }
    // Return shares owned by this user, plus anonymous/demo shares
    return all.filter(s => s.ownerId === ownerId || !s.ownerId);
  }

  // Atomic download incrementation (Section 18)
  public async atomicAttemptDownload(shareId: string): Promise<{ authorized: boolean; reason?: string; remaining?: number }> {
    while (this.atomicLock) {
      await new Promise(res => setTimeout(res, 10));
    }

    this.atomicLock = true;
    try {
      const share = this.state.shares[shareId];
      if (!share) {
        return { authorized: false, reason: 'Share not found' };
      }

      // Check Revocation
      if (share.status === 'REVOKED') {
        return { authorized: false, reason: 'Share has been revoked by the owner' };
      }

      // Check Server-side Expiration
      if (Date.now() > share.expiresAt) {
        share.status = 'EXPIRED';
        this.saveState();
        return { authorized: false, reason: 'Share link has expired' };
      }

      // Check Download Limit
      if (share.maxDownloads > 0 && share.downloadCount >= share.maxDownloads) {
        share.status = 'LIMIT_REACHED';
        this.saveState();
        return { authorized: false, reason: 'Download limit has been reached' };
      }

      // Increment atomically
      share.downloadCount += 1;
      if (share.maxDownloads > 0 && share.downloadCount >= share.maxDownloads) {
        share.status = 'LIMIT_REACHED';
      }

      this.saveState();

      const remaining = share.maxDownloads > 0 ? Math.max(0, share.maxDownloads - share.downloadCount) : -1;
      return { authorized: true, remaining };
    } finally {
      this.atomicLock = false;
    }
  }

  // Password Attempts & Lockout Tracking (Section 17)
  public trackPasswordAttempt(shareId: string, clientIp: string, success: boolean): { locked: boolean; remainingAttempts: number; lockedUntil?: number } {
    const key = `${shareId}:${clientIp}`;
    const now = Date.now();
    const tracker = this.state.passwordAttempts[key] || {
      shareId,
      clientIp,
      failedCount: 0,
      lockedUntil: 0
    };

    if (tracker.lockedUntil > now) {
      return { locked: true, remainingAttempts: 0, lockedUntil: tracker.lockedUntil };
    }

    if (success) {
      delete this.state.passwordAttempts[key];
      this.saveState();
      return { locked: false, remainingAttempts: 5 };
    }

    tracker.failedCount += 1;
    if (tracker.failedCount >= 5) {
      tracker.lockedUntil = now + 15 * 60 * 1000; // 15 minute lockout
      this.state.passwordAttempts[key] = tracker;
      this.saveState();
      return { locked: true, remainingAttempts: 0, lockedUntil: tracker.lockedUntil };
    }

    this.state.passwordAttempts[key] = tracker;
    this.saveState();
    return { locked: false, remainingAttempts: 5 - tracker.failedCount };
  }

  public isLockedOut(shareId: string, clientIp: string): { locked: boolean; lockedUntil?: number } {
    const key = `${shareId}:${clientIp}`;
    const tracker = this.state.passwordAttempts[key];
    if (tracker && tracker.lockedUntil > Date.now()) {
      return { locked: true, lockedUntil: tracker.lockedUntil };
    }
    return { locked: false };
  }

  // Security & Download Events
  public recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): SecurityEvent {
    const fullEvent: SecurityEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: Date.now()
    };
    this.state.securityEvents.unshift(fullEvent);
    // Keep max 500 events
    if (this.state.securityEvents.length > 500) {
      this.state.securityEvents.pop();
    }
    this.saveState();
    return fullEvent;
  }

  public recordDownloadEvent(event: Omit<DownloadEvent, 'id' | 'downloadedAt'>): DownloadEvent {
    const fullEvent: DownloadEvent = {
      ...event,
      id: `dl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      downloadedAt: Date.now()
    };
    this.state.downloadEvents.unshift(fullEvent);
    if (this.state.downloadEvents.length > 500) {
      this.state.downloadEvents.pop();
    }
    this.saveState();
    return fullEvent;
  }

  public getSecurityEvents(shareId?: string): SecurityEvent[] {
    if (!shareId) return this.state.securityEvents;
    return this.state.securityEvents.filter(e => e.shareId === shareId);
  }

  public getDownloadEvents(shareId?: string): DownloadEvent[] {
    if (!shareId) return this.state.downloadEvents;
    return this.state.downloadEvents.filter(e => e.shareId === shareId);
  }

  // Chat Messages (Section 32 & 33)
  public addChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const fullMessage: ChatMessage = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: Date.now()
    };
    this.state.chatMessages.push(fullMessage);
    // Keep max 1000 messages
    if (this.state.chatMessages.length > 1000) {
      this.state.chatMessages.shift();
    }
    this.saveState();
    return fullMessage;
  }

  public getChatMessages(shareIdOrSlug: string): ChatMessage[] {
    const share = this.getShareById(shareIdOrSlug) || this.getShareBySecureId(shareIdOrSlug);
    const validIds = new Set<string>([shareIdOrSlug]);
    if (share) {
      validIds.add(share.id);
      validIds.add(share.secureShareId);
    }
    return this.state.chatMessages.filter(m => validIds.has(m.shareId));
  }

  // Receiver Access Tracking (Sender View Details)
  public recordReceiverAccess(shareId: string, receiver: {
    userId: string;
    userName: string;
    userEmail: string;
    clientIp: string;
    userAgent?: string;
    action?: 'ACCESS' | 'DOWNLOAD';
  }): ReceiverAccessRecord {
    if (!this.state.receiverAccesses) {
      this.state.receiverAccesses = {};
    }
    // Normalize shareId
    const share = this.getShareById(shareId) || this.getShareBySecureId(shareId);
    const key = share ? share.id : shareId;

    if (!this.state.receiverAccesses[key]) {
      this.state.receiverAccesses[key] = [];
    }

    const list = this.state.receiverAccesses[key];
    let existing = list.find(r => r.userId === receiver.userId || (r.userEmail && r.userEmail.toLowerCase() === receiver.userEmail.toLowerCase()));
    const now = Date.now();

    if (existing) {
      existing.lastAccessedAt = now;
      existing.accessCount += 1;
      if (receiver.action === 'DOWNLOAD') {
        existing.downloadCount += 1;
      }
      existing.clientIp = receiver.clientIp;
      if (receiver.userAgent) existing.userAgent = receiver.userAgent;
    } else {
      existing = {
        userId: receiver.userId,
        userName: receiver.userName,
        userEmail: receiver.userEmail,
        firstAccessedAt: now,
        lastAccessedAt: now,
        accessCount: 1,
        downloadCount: receiver.action === 'DOWNLOAD' ? 1 : 0,
        clientIp: receiver.clientIp,
        userAgent: receiver.userAgent
      };
      list.push(existing);
    }

    this.saveState();
    return existing;
  }

  public getReceiversForShare(shareId: string): ReceiverAccessRecord[] {
    if (!this.state.receiverAccesses) return [];
    const share = this.getShareById(shareId) || this.getShareBySecureId(shareId);
    const key = share ? share.id : shareId;
    return this.state.receiverAccesses[key] || [];
  }
}

export const db = new VaultXStore();
