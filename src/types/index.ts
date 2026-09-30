export interface FileRecord {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  sha256Original: string;
  version: number;
  createdAt: number;
  updatedAt?: number;
}

export type ShareStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'LIMIT_REACHED';

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

export interface ShareRecord {
  id: string;
  secureShareId: string;
  shareUrl: string;
  status: ShareStatus;
  maxDownloads: number;
  downloadCount: number;
  expiresAt: number;
  hasPassword: boolean;
  securityScore: number;
  fileCount: number;
  createdAt: number;
  revokedAt?: number | null;
  requireOtp?: boolean;
  otpPreview?: string;
  receiversCount?: number;
  receivers?: ReceiverAccessRecord[];
}

export interface SecurityEvent {
  id: string;
  timestamp: number;
  shareId?: string | null;
  eventType: string;
  success: boolean;
  clientIp: string;
  userAgent: string;
  riskScore: number;
  details: string;
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

export interface ChatMessage {
  id: string;
  shareId: string;
  senderType: 'SENDER' | 'RECEIVER';
  senderName: string;
  text: string;
  timestamp: number;
}

export interface CompressionAnalysisItem {
  filename: string;
  size: number;
  extension: string;
  canCompressLossless: boolean;
  status: 'LOSSLESS_AVAILABLE' | 'COMPRESSION_SKIPPED' | 'ALREADY_COMPACT';
  reason: string;
}

export interface CompressionAnalysisResult {
  totalSize: number;
  isOver500MB: boolean;
  items: CompressionAnalysisItem[];
  compressibleCount: number;
  skippedCount: number;
}

export interface SecurityControl {
  name: string;
  standard: string;
  enabled: boolean;
  details: string;
}

export interface SecurityStats {
  filesCount: number;
  activeSharesCount: number;
  revokedSharesCount: number;
  downloadsCount: number;
  blockedAttemptsCount: number;
  controls: SecurityControl[];
}

export interface AutomatedTestResult {
  category: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  results: AutomatedTestResult[];
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  verified: boolean;
}
