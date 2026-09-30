import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  ShieldAlert,
  Download,
  FileArchive,
  FileText,
  Clock,
  MessageSquare,
  AlertOctagon,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Check,
  User,
  LogIn,
  KeyRound,
  Mail
} from 'lucide-react';
import { api } from '../services/api';
import { ChatModal } from './ChatModal';
import { UserAccount } from '../types';

interface ReceiverViewProps {
  secureShareId: string;
  onExit?: () => void;
  currentUser?: UserAccount | null;
  onLoginSuccess?: (user: UserAccount, token: string) => void;
}

interface PublicFileInfo {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  sha256Original: string;
  version: number;
}

export const ReceiverView: React.FC<ReceiverViewProps> = ({
  secureShareId,
  onExit,
  currentUser,
  onLoginSuccess
}) => {
  // Authentication state for receiver
  const [user, setUser] = useState<UserAccount | null>(() => {
    if (currentUser) return currentUser;
    const stored = localStorage.getItem('vaultx_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return null;
  });

  const [requiresLogin, setRequiresLogin] = useState<boolean>(!user);

  // Inline login state
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Share state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [files, setFiles] = useState<PublicFileInfo[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [maxDownloads, setMaxDownloads] = useState<number>(0);
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setRequiresLogin(false);
    }
  }, [currentUser]);

  const fetchShareInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPublicShare(secureShareId);
      if (data.requiresLogin) {
        setRequiresLogin(true);
        setIsPasswordProtected(data.isPasswordProtected);
        setExpiresAt(data.expiresAt || 0);
        return;
      }

      setRequiresLogin(false);
      setIsPasswordProtected(data.isPasswordProtected);
      setExpiresAt(data.expiresAt || 0);
      setMaxDownloads(data.maxDownloads || 0);
      setDownloadCount(data.downloadCount || 0);

      if (!data.isPasswordProtected && data.files) {
        setFiles(data.files);
        setSelectedFileIds(data.files.map((f: PublicFileInfo) => f.id));
      }
    } catch (err: any) {
      if (err.requiresLogin || err.status === 401) {
        setRequiresLogin(true);
      } else {
        setError(err.message || 'Failed to load share');
        setErrorStatus(err.status || 'ERROR');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShareInfo();
  }, [secureShareId, user]);

  // Live visual countdown
  useEffect(() => {
    if (!expiresAt) return;
    const updateTime = () => {
      const diff = Math.max(0, expiresAt - Date.now());
      if (diff === 0) {
        setTimeLeft('EXPIRED');
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleInlineAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'REGISTER') {
        if (!authName.trim()) {
          setAuthError('Please provide your name');
          setAuthLoading(false);
          return;
        }
        await api.register(authName, authEmail, authPassword);
        // Automatic login after registration
        const res = await api.login(authEmail, authPassword);
        handleSetAuthenticated(res.user, res.token);
      } else {
        const res = await api.login(authEmail, authPassword);
        handleSetAuthenticated(res.user, res.token);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleQuickSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const emailToUse = authEmail.trim() || 'sbbharath81@gmail.com';
      const nameToUse = authName.trim() || 'Bharath';
      const res = await api.loginWithGoogle(undefined, emailToUse, nameToUse);
      handleSetAuthenticated(res.user, res.token);
    } catch (err: any) {
      setAuthError(err.message || 'Google authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSetAuthenticated = (account: UserAccount, token: string) => {
    setUser(account);
    localStorage.setItem('vaultx_auth_token', token);
    localStorage.setItem('vaultx_user', JSON.stringify(account));
    setRequiresLogin(false);
    if (onLoginSuccess) {
      onLoginSuccess(account, token);
    }
    fetchShareInfo();
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unlocking) return;
    setUnlocking(true);
    setError(null);

    try {
      const res = await api.unlockShare(secureShareId, password);
      setSessionToken(res.token);
      setFiles(res.files || []);
      setSelectedFileIds((res.files || []).map((f: PublicFileInfo) => f.id));
      setExpiresAt(res.expiresAt);
      setMaxDownloads(res.maxDownloads);
      setDownloadCount(res.downloadCount);
      setIsPasswordProtected(false);
    } catch (err: any) {
      if (err.requiresLogin) {
        setRequiresLogin(true);
      } else {
        setError(err.message || 'Incorrect passkey');
        if (err.remainingAttempts !== undefined) {
          setRemainingAttempts(err.remainingAttempts);
        }
        if (err.lockedUntil) {
          setLockedUntil(err.lockedUntil);
        }
      }
    } finally {
      setUnlocking(false);
    }
  };

  const handleDownloadSingle = async (fileId: string, fileName: string) => {
    try {
      await api.downloadSingleFile(secureShareId, fileId, sessionToken || undefined);
      setDownloadCount(prev => prev + 1);
      setDownloadSuccessMessage(`Decrypted & downloaded: ${fileName}`);
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  };

  const handleDownloadZip = async () => {
    if (selectedFileIds.length === 0) return;
    setDownloadingZip(true);
    try {
      await api.downloadSelectedZip(secureShareId, selectedFileIds, sessionToken || undefined);
      setDownloadCount(prev => prev + 1);
      setDownloadSuccessMessage(`Decrypted & downloaded ${selectedFileIds.length} files as ZIP`);
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'ZIP packaging failed');
    } finally {
      setDownloadingZip(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const toggleSelect = (id: string) => {
    if (selectedFileIds.includes(id)) {
      setSelectedFileIds(selectedFileIds.filter(i => i !== id));
    } else {
      setSelectedFileIds([...selectedFileIds, id]);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#171717] text-[#E43D12] animate-pulse">
          <Lock className="h-6 w-6" />
        </div>
        <p className="mt-4 text-xs font-mono uppercase tracking-widest text-[#5F5B55]">
          Verifying Zero-Trust Access Policy...
        </p>
      </div>
    );
  }

  // Revocation / Expiration state
  if (errorStatus === 'REVOKED' || errorStatus === 'EXPIRED' || errorStatus === 'LIMIT_REACHED') {
    return (
      <div className="mx-auto max-w-lg mt-12 rounded-sm border border-[rgba(23,23,23,0.15)] bg-white p-8 sm:p-10 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-sm bg-[#D6536D]/15 text-[#D6536D]">
          <AlertOctagon className="h-7 w-7" />
        </div>
        <span className="mt-4 text-[10px] font-mono font-bold uppercase tracking-widest text-[#D6536D] block">
          SECURITY EXCEPTION
        </span>
        <h2 className="mt-1 text-2xl font-display font-extrabold uppercase text-[#171717]">
          {errorStatus === 'REVOKED' ? 'Access Revoked' : errorStatus === 'EXPIRED' ? 'Link Expired' : 'Download Limit Reached'}
        </h2>
        <p className="mt-3 text-xs sm:text-sm text-[#5F5B55] leading-relaxed">
          {errorStatus === 'REVOKED'
            ? 'The owner has executed the instant server kill switch for this sharing link. All future access attempts are blocked.'
            : errorStatus === 'EXPIRED'
            ? 'This link has exceeded its configured server lifetime and is no longer accessible.'
            : 'The maximum permitted downloads for this share have been satisfied.'}
        </p>

        <div className="mt-6 pt-6 border-t border-[rgba(23,23,23,0.08)] flex justify-center">
          {onExit && (
            <button
              onClick={onExit}
              className="inline-flex rounded-sm bg-[#171717] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-black transition-colors"
            >
              Return to VaultX Home
            </button>
          )}
        </div>
      </div>
    );
  }

  // STEP 1: RECEIVER AUTHENTICATION REQUIRED (User must login 1st)
  if (requiresLogin || !user) {
    return (
      <div className="mx-auto max-w-md mt-6 sm:mt-10 rounded-sm border border-[rgba(23,23,23,0.12)] bg-white p-6 sm:p-8 shadow-md">
        <div className="text-center space-y-2 pb-5 border-b border-[rgba(23,23,23,0.08)]">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-sm bg-[#171717] text-[#E43D12]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#E43D12] font-semibold block">
            RECEIVER IDENTITY VERIFICATION
          </span>
          <h2 className="text-2xl font-display font-extrabold uppercase tracking-tight text-[#171717]">
            Sign In to Access
          </h2>
          <p className="text-xs text-[#5F5B55] leading-relaxed">
            The sender requires all recipients to be authenticated before accessing this zero-trust file bundle. Once logged in, you can enter the passkey to access and download files multiple times.
          </p>
        </div>

        {/* Quick Google Sign In */}
        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={handleGoogleQuickSignIn}
            disabled={authLoading}
            className="w-full inline-flex items-center justify-center gap-2.5 rounded-sm border border-[rgba(23,23,23,0.2)] bg-white py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-[#171717] hover:border-[#171717] hover:bg-[#FAF8F5] transition-all shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-[rgba(23,23,23,0.1)] w-full" />
            <span className="bg-white px-3 text-[10px] font-mono uppercase tracking-wider text-[#5F5B55] absolute">
              OR USE EMAIL
            </span>
          </div>

          {/* Toggle Login / Register */}
          <div className="flex border border-[rgba(23,23,23,0.15)] rounded-sm p-0.5 bg-[#FAF8F5]">
            <button
              type="button"
              onClick={() => { setAuthMode('LOGIN'); setAuthError(null); }}
              className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase transition-all ${
                authMode === 'LOGIN' ? 'bg-white text-[#E43D12] shadow-sm' : 'text-[#5F5B55]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('REGISTER'); setAuthError(null); }}
              className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase transition-all ${
                authMode === 'REGISTER' ? 'bg-white text-[#E43D12] shadow-sm' : 'text-[#5F5B55]'
              }`}
            >
              New Account
            </button>
          </div>

          <form onSubmit={handleInlineAuth} className="space-y-3 pt-1">
            {authMode === 'REGISTER' && (
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F5B55] mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#5F5B55]" />
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Recipient Name"
                    className="w-full rounded-sm border border-[rgba(23,23,23,0.2)] bg-[#FAF8F5] pl-9 pr-3 py-2 text-xs text-[#171717] focus:border-[#E43D12] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F5B55] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#5F5B55]" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full rounded-sm border border-[rgba(23,23,23,0.2)] bg-[#FAF8F5] pl-9 pr-3 py-2 text-xs text-[#171717] focus:border-[#E43D12] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F5B55] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#5F5B55]" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-sm border border-[rgba(23,23,23,0.2)] bg-[#FAF8F5] pl-9 pr-3 py-2 text-xs text-[#171717] focus:border-[#E43D12] focus:outline-none"
                />
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 rounded-sm border border-[#D6536D]/30 bg-[#D6536D]/10 p-2 text-xs text-[#D6536D]">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#D6536D]" />
                <span className="font-medium">{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#E43D12] py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm hover:bg-[#c9330d] disabled:opacity-50 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{authLoading ? 'Authenticating...' : authMode === 'LOGIN' ? 'Sign In & Access Files' : 'Create Account & Access'}</span>
            </button>
          </form>
        </div>

        <div className="mt-5 pt-3 border-t border-[rgba(23,23,23,0.08)] flex items-center justify-center gap-2 text-[10px] font-mono text-[#5F5B55]">
          <CheckCircle2 className="h-3 w-3 text-[#34A853]" />
          <span>Audit-compliant receiver verification enforced</span>
        </div>
      </div>
    );
  }

  // STEP 2: USER IS LOGGED IN -> ENTER PASSKEY (If password protected)
  if (isPasswordProtected) {
    return (
      <div className="mx-auto max-w-md mt-6 sm:mt-10 rounded-sm border border-[rgba(23,23,23,0.12)] bg-white p-6 sm:p-8 shadow-md">
        {/* Authenticated Receiver Badge */}
        <div className="flex items-center justify-between bg-[#FAF8F5] border border-[rgba(23,23,23,0.1)] p-2.5 rounded-sm mb-5 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#34A853]" />
            <span className="font-mono text-[10px] text-[#5F5B55] uppercase">Verified Receiver:</span>
            <span className="font-bold text-[#171717] truncate max-w-[170px]">{user.name}</span>
          </div>
          <span className="text-[10px] font-mono text-[#34A853] font-bold">AUTHENTICATED</span>
        </div>

        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#E43D12] font-semibold block">
            VAULTX • PASSKEY REQUIRED
          </span>
          <h2 className="text-2xl font-display font-extrabold uppercase tracking-tight text-[#171717]">
            Enter Passkey
          </h2>
          <p className="text-xs text-[#5F5B55]">
            This document bundle is encrypted with an isolated key. Enter the passkey issued by the sender to decrypt. You can access and download files multiple times using your authenticated session.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="mt-6 space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F5B55] mb-1.5">
              File Access Passkey
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passkey..."
                required
                className="w-full rounded-sm border border-[rgba(23,23,23,0.2)] bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#5F5B55] focus:border-[#E43D12] focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#5F5B55] hover:text-[#171717]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {remainingAttempts !== null && remainingAttempts < 5 && (
              <p className="mt-1 text-[11px] font-mono text-[#EFB11D] font-semibold">
                Warning: {remainingAttempts} attempt(s) remaining before 15-minute lockout.
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-sm border border-[#D6536D]/30 bg-[#D6536D]/10 p-2.5 text-xs text-[#D6536D]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#D6536D]" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={unlocking || !password}
            className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#E43D12] py-3 text-xs font-bold uppercase tracking-widest text-white shadow-sm hover:bg-[#c9330d] disabled:opacity-50 transition-colors"
          >
            <Unlock className="h-3.5 w-3.5" />
            <span>{unlocking ? 'Authenticating & Verifying...' : 'Unlock & Access Files'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowChat(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-sm border border-[rgba(23,23,23,0.15)] bg-white py-2.5 text-xs font-bold uppercase tracking-wider text-[#171717] hover:bg-[#FAF8F5] transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-[#E43D12]" />
            <span>Chat with Sender (as {user.name.split(' ')[0]})</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[rgba(23,23,23,0.08)] flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono tracking-wider text-[#5F5B55] uppercase">
          <span>Encrypted connection</span>
          <span>•</span>
          <span>Access logged to sender</span>
          <span>•</span>
          <span>Multi-download ready</span>
        </div>

        {showChat && (
          <ChatModal
            secureShareId={secureShareId}
            senderType="RECEIVER"
            senderName={`${user.name} (${user.email})`}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>
    );
  }

  // STEP 3: UNLOCKED RECEIVER PORTAL (Authenticated + Passkey verified)
  const primaryFile = files[0];
  const expiresFormatted = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    : 'UPON EXPIRY';

  return (
    <div className="mx-auto max-w-4xl space-y-6 mt-4 sm:mt-6">
      {/* Toast Feedback */}
      {downloadSuccessMessage && (
        <div className="flex items-center gap-2 rounded-sm border border-[#34A853]/30 bg-white px-4 py-3 text-xs text-[#171717] shadow-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#34A853]" />
          <span className="font-semibold">{downloadSuccessMessage}</span>
        </div>
      )}

      {/* Receiver Identity Confirmation Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[rgba(23,23,23,0.12)] p-3.5 rounded-sm shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#171717] text-[#E43D12] text-xs font-mono font-bold">
            RX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F5B55]">
                Authenticated Receiver:
              </span>
              <span className="font-bold text-xs text-[#171717]">{user.name}</span>
              <span className="text-[11px] font-mono text-[#5F5B55]">({user.email})</span>
            </div>
            <p className="text-[10px] font-mono text-[#34A853] mt-0.5 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Access logged & verified by sender • Multiple downloads authorized
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowChat(true)}
          className="inline-flex items-center gap-1.5 rounded-sm border border-[rgba(23,23,23,0.15)] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#171717] hover:border-[#171717] transition-colors self-start sm:self-auto shrink-0"
        >
          <MessageSquare className="h-3.5 w-3.5 text-[#E43D12]" />
          <span>Chat with Sender</span>
        </button>
      </div>

      {/* Standalone Editorial Hero Card (Section 14) */}
      <div className="rounded-sm border border-[rgba(23,23,23,0.12)] bg-white p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-[rgba(23,23,23,0.1)] pb-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E43D12] block">
              VAULTX • SECURE ACCESS
            </span>
            <p className="text-xs font-mono uppercase tracking-wider text-[#5F5B55]">
              You have been granted access to:
            </p>
            <h1 className="text-3xl sm:text-5xl font-display font-extrabold uppercase text-[#171717] tracking-tight leading-none break-all">
              {primaryFile ? primaryFile.originalName : 'VERIFIED DOCUMENT BUNDLE'}
            </h1>
          </div>
        </div>

        {/* Access Granted Badge & Expiration */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#5F5B55] block">
              ACCESS GRANTED UNTIL
            </span>
            <span className="text-xl sm:text-2xl font-display font-extrabold text-[#171717] uppercase tracking-tight">
              {expiresFormatted}
            </span>
            <span className="text-xs font-mono text-[#E43D12] font-semibold block mt-0.5">
              TTL REMAINING: {timeLeft || 'ACTIVE'}
            </span>
          </div>

          {/* Primary CTA Button */}
          <div className="flex flex-wrap items-center gap-3">
            {files.length === 1 ? (
              <button
                onClick={() => handleDownloadSingle(primaryFile.id, primaryFile.originalName)}
                className="inline-flex items-center gap-2.5 rounded-sm bg-[#E43D12] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm hover:bg-[#c9330d] active:scale-[0.98] transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Download Secure File</span>
              </button>
            ) : (
              <button
                onClick={handleDownloadZip}
                disabled={downloadingZip || selectedFileIds.length === 0}
                className="inline-flex items-center gap-2.5 rounded-sm bg-[#E43D12] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm hover:bg-[#c9330d] active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                <FileArchive className="h-4 w-4" />
                <span>{downloadingZip ? 'Packaging ZIP Archive...' : `Download ${selectedFileIds.length} Files as ZIP`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Security Messaging */}
        <div className="mt-8 pt-4 border-t border-[rgba(23,23,23,0.08)] flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono tracking-wider text-[#5F5B55] uppercase">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34A853]" />
            <span>Encrypted connection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34A853]" />
            <span>Access logged to sender</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34A853]" />
            <span>Download protected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#171717] font-semibold">
              LIMIT: {maxDownloads > 0 ? `${downloadCount}/${maxDownloads}` : 'UNLIMITED'}
            </span>
          </div>
        </div>
      </div>

      {/* Files Collection (If bundle contains multiple files or detailed metadata) */}
      <div className="rounded-sm border border-[rgba(23,23,23,0.12)] bg-white overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(23,23,23,0.1)] p-4 bg-[#FAF8F5]">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#171717]">
            VERIFIED OBJECTS IN PAYLOAD ({files.length})
          </span>

          {files.length > 1 && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <button
                onClick={() => {
                  if (selectedFileIds.length === files.length) setSelectedFileIds([]);
                  else setSelectedFileIds(files.map(f => f.id));
                }}
                className="text-[#5F5B55] hover:text-[#171717] underline underline-offset-2"
              >
                {selectedFileIds.length === files.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          )}
        </div>

        <div className="divide-y divide-[rgba(23,23,23,0.08)]">
          {files.map((file, idx) => {
            const isSelected = selectedFileIds.includes(file.id);
            return (
              <div
                key={file.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[#FAF8F5] ${
                  isSelected ? 'bg-[#E43D12]/5' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {files.length > 1 && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(file.id)}
                      className="h-4 w-4 rounded border-[rgba(23,23,23,0.2)] text-[#E43D12] focus:ring-[#E43D12]"
                    />
                  )}
                  <span className="font-mono text-xs font-bold text-[#E43D12]">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-xs text-[#171717] truncate font-sans">
                      {file.originalName}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-[#5F5B55] mt-0.5">
                      <span>{formatSize(file.size)}</span>
                      <span>•</span>
                      <span>AES-256-GCM</span>
                      <span>•</span>
                      <span className="truncate max-w-[200px]" title={file.sha256Original}>
                        SHA-256: {file.sha256Original.slice(0, 12)}...
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleDownloadSingle(file.id, file.originalName)}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-[rgba(23,23,23,0.2)] bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#171717] hover:border-[#171717] hover:bg-[#FAF8F5] transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-[#E43D12]" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Drawer */}
      {showChat && (
        <ChatModal
          secureShareId={secureShareId}
          senderType="RECEIVER"
          senderName={`${user.name} (${user.email})`}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};
