import React, { useState } from 'react';
import { Lock, Clock, Download, Shield, Sparkles, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { FileRecord, ShareRecord } from '../types';

interface CreateShareModalProps {
  files: FileRecord[];
  onClose: () => void;
  onSuccess: (share: ShareRecord) => void;
}

export const CreateShareModal: React.FC<CreateShareModalProps> = ({ files, onClose, onSuccess }) => {
  const [passwordProtection, setPasswordProtection] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [downloadLimit, setDownloadLimit] = useState(15);
  const [expirationHours, setExpirationHours] = useState(24);
  const [requireOtp, setRequireOtp] = useState(false);
  const [deviceBinding, setDeviceBinding] = useState(false);
  const [downloadNotifications, setDownloadNotifications] = useState(true);
  const [suspiciousAccess, setSuspiciousAccess] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateScore = () => {
    let score = 50; // AES-256-GCM baseline
    if (passwordProtection && password.length >= 6) score += 15;
    if (expirationHours <= 24) score += 10;
    else score += 5;
    if (downloadLimit > 0 && downloadLimit <= 25) score += 10;
    else if (downloadLimit > 0) score += 5;
    if (requireOtp) score += 5;
    if (deviceBinding) score += 5;
    if (suspiciousAccess) score += 5;
    return Math.min(score, 100);
  };

  const securityScore = calculateScore();

  const handleGenerate = async () => {
    if (passwordProtection && (!password || password.length < 6)) {
      setError('Password must be at least 6 characters when password protection is enabled');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.createShare({
        fileIds: files.map(f => f.id),
        password: passwordProtection ? password : undefined,
        maxDownloads: downloadLimit,
        expirationHours,
        requireOtp,
        deviceBinding,
        downloadNotifications,
        suspiciousAccessDetection: suspiciousAccess
      });
      onSuccess(res.share);
    } catch (err: any) {
      setError(err.message || 'Failed to generate secure share');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded border border-[rgba(23,23,23,0.15)] bg-white p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(23,23,23,0.1)]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#E43D12] font-semibold block mb-1">
              CONTROLLED SHARE
            </span>
            <h2 className="text-xl font-display font-bold text-[#171717] uppercase tracking-tight">
              Access Policy Specification
            </h2>
            <p className="text-xs text-[#5F5B55] mt-0.5">
              Configure server-enforced zero-trust restrictions before publishing the cryptographic link.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#5F5B55] hover:bg-[#EBE9E1] hover:text-[#171717] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section: WHAT (Files in Share) */}
        <div className="mt-5 rounded border border-[rgba(23,23,23,0.1)] bg-[#FAF8F5] p-3.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F5B55] font-bold block mb-2">
            WHAT — ENCRYPTED PAYLOAD ({files.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-1.5 rounded border border-[rgba(23,23,23,0.12)] bg-white px-2.5 py-1 text-xs font-mono text-[#171717]"
              >
                <span className="text-[#E43D12] font-bold">{(i + 1).toString().padStart(2, '0')}</span>
                <span className="truncate max-w-[170px]">{f.originalName}</span>
                <span className="text-[10px] text-[#5F5B55]">v{f.version}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Section: SECURITY (Passphrase Protection) */}
        <div className="mt-6 space-y-4">
          <div className="rounded border border-[rgba(23,23,23,0.12)] bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#E43D12]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Password Protection (Argon2id)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPasswordProtection(!passwordProtection)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  passwordProtection ? 'bg-[#E43D12]' : 'bg-[rgba(23,23,23,0.2)]'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform mt-[3px] ml-[3px] ${
                    passwordProtection ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {passwordProtection && (
              <div className="mt-3 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a secret passphrase to unlock all files..."
                  className="w-full rounded border border-[rgba(23,23,23,0.2)] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#171717] placeholder-[#5F5B55] focus:border-[#E43D12] focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#5F5B55] hover:text-[#171717]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <p className="mt-1.5 text-[11px] text-[#5F5B55]">
                  Hashed with Argon2id / 100,000-round salted PBKDF2. Receivers are locked out for 15 minutes after 5 failed attempts.
                </p>
              </div>
            )}
          </div>

          {/* Section: WHEN & ACCESS (Expiration & Download Limits) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Download Limit */}
            <div className="rounded border border-[rgba(23,23,23,0.12)] bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-4 w-4 text-[#E43D12]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                  ACCESS — Max Downloads
                </span>
              </div>
              <select
                value={downloadLimit}
                onChange={(e) => setDownloadLimit(Number(e.target.value))}
                className="w-full rounded border border-[rgba(23,23,23,0.2)] bg-[#FAF8F5] px-3 py-2 text-xs text-[#171717] focus:border-[#E43D12] focus:outline-none"
              >
                <option value={1}>1 download (Burn after reading)</option>
                <option value={5}>5 downloads</option>
                <option value={10}>10 downloads</option>
                <option value={15}>15 downloads (Standard)</option>
                <option value={25}>25 downloads</option>
                <option value={50}>50 downloads</option>
                <option value={100}>100 downloads</option>
                <option value={0}>Unlimited</option>
              </select>
              <p className="mt-1 text-[11px] text-[#5F5B55]">
                Enforced by atomic server mutex to prevent race condition bypasses.
              </p>
            </div>

            {/* Expiration */}
            <div className="rounded border border-[rgba(23,23,23,0.12)] bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-[#E43D12]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                  WHEN — Expiration Period
                </span>
              </div>
              <select
                value={expirationHours}
                onChange={(e) => setExpirationHours(Number(e.target.value))}
                className="w-full rounded border border-[rgba(23,23,23,0.2)] bg-[#FAF8F5] px-3 py-2 text-xs text-[#171717] focus:border-[#E43D12] focus:outline-none"
              >
                <option value={0.25}>15 minutes (High Security)</option>
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours (Recommended)</option>
                <option value={72}>3 days</option>
                <option value={168}>7 days</option>
              </select>
              <p className="mt-1 text-[11px] text-[#5F5B55]">
                Self-destructs based on server clock. Client timers are never trusted.
              </p>
            </div>
          </div>

          {/* Section: ADVANCED GOVERNANCE */}
          <div className="rounded border border-[rgba(23,23,23,0.12)] bg-[#FAF8F5] p-4 space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#171717] block">
              Advanced Security Toggles
            </span>

            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-[#171717]">OTP Verification</span>
                <p className="text-[11px] text-[#5F5B55]">Require secondary 6-digit confirmation code</p>
              </div>
              <input
                type="checkbox"
                checked={requireOtp}
                onChange={(e) => setRequireOtp(e.target.checked)}
                className="h-4 w-4 rounded border-[rgba(23,23,23,0.2)] text-[#E43D12] focus:ring-[#E43D12]"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-2.5 border-t border-[rgba(23,23,23,0.08)]">
              <div>
                <span className="font-semibold text-[#171717]">Device Session Binding</span>
                <p className="text-[11px] text-[#5F5B55]">Pin HMAC access token to receiver IP / device fingerprint</p>
              </div>
              <input
                type="checkbox"
                checked={deviceBinding}
                onChange={(e) => setDeviceBinding(e.target.checked)}
                className="h-4 w-4 rounded border-[rgba(23,23,23,0.2)] text-[#E43D12] focus:ring-[#E43D12]"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-2.5 border-t border-[rgba(23,23,23,0.08)]">
              <div>
                <span className="font-semibold text-[#171717]">Suspicious Access Heuristics</span>
                <p className="text-[11px] text-[#5F5B55]">Monitor rapid requests & repeated password attempts</p>
              </div>
              <input
                type="checkbox"
                checked={suspiciousAccess}
                onChange={(e) => setSuspiciousAccess(e.target.checked)}
                className="h-4 w-4 rounded border-[rgba(23,23,23,0.2)] text-[#E43D12] focus:ring-[#E43D12]"
              />
            </div>
          </div>

          {/* Security Posture Indicator */}
          <div className="rounded border border-[rgba(23,23,23,0.12)] bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#E43D12]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Calculated Security Posture
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-[#E43D12] tabular-nums">
                {securityScore}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[rgba(23,23,23,0.1)]">
              <div
                className="h-full rounded-full bg-[#E43D12] transition-all duration-300"
                style={{ width: `${securityScore}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded border border-[#D6536D]/30 bg-[#D6536D]/10 p-3 text-xs text-[#D6536D]">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#D6536D]" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[rgba(23,23,23,0.1)]">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#5F5B55] hover:text-[#171717] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded bg-[#E43D12] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c9330d] active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
          >
            {loading ? 'Provisioning Link...' : 'Create Secure Share'}
          </button>
        </div>
      </div>
    </div>
  );
};
