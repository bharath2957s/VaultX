import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { FileManager } from './components/FileManager';
import { SharesManager } from './components/SharesManager';
import { SecurityCenter } from './components/SecurityCenter';
import { ActivityLog } from './components/ActivityLog';
import { ReceiverView } from './components/ReceiverView';
import { UploadZone } from './components/UploadZone';
import { CreateShareModal } from './components/CreateShareModal';
import { ShareCreatedModal } from './components/ShareCreatedModal';
import { AuthModal } from './components/AuthModal';
import { ChatModal } from './components/ChatModal';
import { ColorRail } from './components/ColorRail';

import { FileRecord, ShareRecord, UserAccount, SecurityStats } from './types';
import { api } from './services/api';

import {
  FileText,
  Share2,
  Download,
  ShieldAlert,
  ArrowRight,
  Plus,
  RefreshCw,
  ExternalLink,
  Lock,
  CheckCircle2,
  Terminal,
  Activity,
  MessageSquare
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [user, setUser] = useState<UserAccount | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);

  // Modals
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateShare, setShowCreateShare] = useState(false);
  const [filesToShare, setFilesToShare] = useState<FileRecord[]>([]);
  const [createdShare, setCreatedShare] = useState<ShareRecord | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [chatShareSlug, setChatShareSlug] = useState<string | null>(null);

  // Receiver View State
  const [receiverSlug, setReceiverSlug] = useState<string | null>(null);
  const [activityShareId, setActivityShareId] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Parse path on initial load (e.g., /s/:slug or verify-email)
  useEffect(() => {
    const checkPath = () => {
      const path = window.location.pathname;
      if (path.startsWith('/s/')) {
        const slug = path.replace('/s/', '').trim();
        if (slug) {
          setReceiverSlug(slug);
          setCurrentTab('receiver');
        }
      }
    };
    checkPath();
    window.addEventListener('popstate', checkPath);
    return () => window.removeEventListener('popstate', checkPath);
  }, []);

  // Restore authenticated user session if present
  useEffect(() => {
    const storedUser = localStorage.getItem('vaultx_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }
  }, []);

  const loadData = async () => {
    try {
      const [filesRes, sharesRes, statsRes] = await Promise.all([
        api.listFiles().catch(() => ({ files: [] })),
        api.listShares().catch(() => ({ shares: [] })),
        api.getSecurityStats().catch(() => null)
      ]);
      setFiles(filesRes.files || []);
      setShares(sharesRes.shares || []);
      if (statsRes) setStats(statsRes);
    } catch (err) {
      console.warn('Initial data load warning:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleTabChange = (tab: string) => {
    if (tab !== 'receiver') {
      setReceiverSlug(null);
      if (window.location.pathname.startsWith('/s/')) {
        window.history.pushState({}, '', '/');
      }
    }
    setCurrentTab(tab);
  };

  const handleOpenReceiverSlug = (slug: string) => {
    setReceiverSlug(slug);
    setCurrentTab('receiver');
    window.history.pushState({}, '', `/s/${slug}`);
  };

  const handleUploadSuccess = (uploaded: FileRecord[]) => {
    setFiles(prev => [...uploaded, ...prev]);
    setShowUpload(false);
    setFilesToShare(uploaded);
    setShowCreateShare(true);
    loadData();
  };

  const handleCreateShareSuccess = (share: ShareRecord) => {
    setShares(prev => [share, ...prev]);
    setShowCreateShare(false);
    setCreatedShare(share);
    loadData();
  };

  const handleViewActivity = (shareId: string) => {
    setActivityShareId(shareId);
    setCreatedShare(null);
    setCurrentTab('activity');
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      await api.revokeShare(shareId);
      setShares(prev => prev.map(s => (s.id === shareId || s.secureShareId === shareId ? { ...s, status: 'REVOKED' } : s)));
      setToastNotification('Share link was immediately revoked. All future access blocked.');
      setTimeout(() => setToastNotification(null), 4000);
      loadData();
      if (createdShare && (createdShare.id === shareId || createdShare.secureShareId === shareId)) {
        setCreatedShare(null);
      }
    } catch (err: any) {
      setToastNotification(`Error: ${err.message || 'Failed to revoke'}`);
      setTimeout(() => setToastNotification(null), 4000);
    }
  };

  const handleLoginSuccess = (account: UserAccount, token: string) => {
    setUser(account);
    localStorage.setItem('vaultx_auth_token', token);
    localStorage.setItem('vaultx_user', JSON.stringify(account));
    setShowAuth(false);
    loadData();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vaultx_auth_token');
    localStorage.removeItem('vaultx_user');
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#EBE9E1] text-[#171717] font-sans selection:bg-[#E43D12] selection:text-white flex flex-col relative lg:pr-12">
      {/* Right-Side Color Rail (Section 5) */}
      <ColorRail />

      {/* Top Bar Navigation (Section 6) */}
      <Navbar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenUpload={() => setShowUpload(true)}
        user={user}
        onOpenAuth={() => setShowAuth(true)}
        onLogout={handleLogout}
        onOpenReceiverDemo={() => handleOpenReceiverSlug('demo-vault-2026')}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {toastNotification && (
          <div className="flex items-center gap-2 rounded-sm border border-[rgba(23,23,23,0.12)] bg-white px-4 py-3 text-xs text-[#171717] shadow-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#34A853]" />
            <span className="font-semibold">{toastNotification}</span>
          </div>
        )}

        {currentTab === 'landing' && (
          <LandingHero
            onStartSharing={() => setShowUpload(true)}
            onOpenDemo={() => handleOpenReceiverSlug('demo-vault-2026')}
            onNavigateTab={handleTabChange}
          />
        )}

        {currentTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Top Editorial Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[rgba(23,23,23,0.12)]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#E43D12] font-semibold block mb-1">
                  01 / LIVE ENGINE METRICS
                </span>
                <h1 className="text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight text-[#171717] leading-none">
                  SECURITY<br />
                  <span className="text-[#E43D12]">COMMAND.</span>
                </h1>
                <p className="text-xs sm:text-sm text-[#5F5B55] mt-3 max-w-xl leading-relaxed">
                  Real-time cryptographic posture across active ephemeral shares, atomic download counters, and verified tamper defenses.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUpload(true)}
                  className="inline-flex items-center gap-2 rounded-sm bg-[#E43D12] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c9330d] active:scale-[0.98] transition-all shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Upload & Share</span>
                </button>
              </div>
            </div>

            {/* Editorial Metric Cards (Section 12) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-sm border border-[rgba(23,23,23,0.12)] bg-white p-5 shadow-sm">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F5B55] block">
                  Encrypted Files
                </span>
                <span className="mt-2 block font-mono text-3xl sm:text-4xl font-extrabold text-[#171717] tabular-nums">
                  {(stats?.filesCount ?? files.length).toString().padStart(2, '0')}
                </span>
                <span className="text-[11px] font-mono text-[#5F5B55] mt-1 block">
                  AES-256-GCM cipher
                </span>
              </div>

              <div className="rounded-sm border border-[rgba(23,23,23,0.12)] bg-white p-5 shadow-sm">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F5B55] block">
                  Active Shares
                </span>
                <span className="mt-2 block font-mono text-3xl sm:text-4xl font-extrabold text-[#E43D12] tabular-nums">
                  {(stats?.activeSharesCount ?? shares.filter(s => s.status === 'ACTIVE').length).toString().padStart(2, '0')}
                </span>
                <span className="text-[11px] font-mono text-[#5F5B55] mt-1 block">
                  Policy governed
                </span>
              </div>

              <div className="rounded-sm border border-[rgba(23,23,23,0.12)] bg-white p-5 shadow-sm">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F5B55] block">
                  Transfers Completed
                </span>
                <span className="mt-2 block font-mono text-3xl sm:text-4xl font-extrabold text-[#EFB11D] tabular-nums">
                  {(stats?.downloadsCount ?? 0).toString().padStart(2, '0')}
                </span>
                <span className="text-[11px] font-mono text-[#5F5B55] mt-1 block">
                  Atomic limit verified
                </span>
              </div>

              <div className="rounded-sm border border-[rgba(23,23,23,0.12)] bg-white p-5 shadow-sm">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F5B55] block">
                  Blocked Ingress
                </span>
                <span className="mt-2 block font-mono text-3xl sm:text-4xl font-extrabold text-[#D6536D] tabular-nums">
                  {(stats?.blockedAttemptsCount ?? 0).toString().padStart(2, '0')}
                </span>
                <span className="text-[11px] font-mono text-[#5F5B55] mt-1 block">
                  Lockout / Revocation
                </span>
              </div>
            </div>

            {/* Quick Actions & Recent Shares Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Recent Shares Collection */}
              <div className="lg:col-span-2 rounded-sm border border-[rgba(23,23,23,0.12)] bg-white p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[rgba(23,23,23,0.08)] pb-3">
                  <h2 className="text-sm font-display font-bold uppercase tracking-wider text-[#171717]">
                    Recent Shared Links
                  </h2>
                  <button
                    onClick={() => setCurrentTab('shares')}
                    className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase text-[#E43D12] hover:underline"
                  >
                    <span>View All Shares</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {shares.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#5F5B55] border border-dashed border-[rgba(23,23,23,0.15)] rounded-sm">
                    No active shares yet. Upload files to generate your first zero-trust ephemeral link.
                  </div>
                ) : (
                  <div className="divide-y divide-[rgba(23,23,23,0.08)]">
                    {shares.slice(0, 5).map(s => (
                      <div key={s.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#171717] truncate">
                              /s/{s.secureShareId}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold uppercase ${
                                s.status === 'ACTIVE'
                                  ? 'text-[#34A853]'
                                  : s.status === 'REVOKED'
                                  ? 'text-[#D6536D]'
                                  : 'text-[#5F5B55]'
                              }`}
                            >
                              • {s.status}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-[#5F5B55]">
                            Downloads: {s.downloadCount}/{s.maxDownloads > 0 ? s.maxDownloads : '∞'} · Security Score: {s.securityScore}%
                            {s.receivers && s.receivers.length > 0 && (
                              <span className="ml-2 text-[#25793d] font-bold">
                                • {s.receivers.length} Receiver{s.receivers.length > 1 ? 's' : ''} ({s.receivers[0].userName})
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setChatShareSlug(s.secureShareId)}
                            className="p-2 rounded-sm text-[#5F5B55] hover:bg-[#FAF8F5] hover:text-[#171717] border border-[rgba(23,23,23,0.1)] transition-colors"
                            title="Open Secure Chat"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-[#E43D12]" />
                          </button>
                          <button
                            onClick={() => handleOpenReceiverSlug(s.secureShareId)}
                            className="p-2 rounded-sm text-[#5F5B55] hover:bg-[#FAF8F5] hover:text-[#171717] border border-[rgba(23,23,23,0.1)] transition-colors"
                            title="Receiver Portal"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleViewActivity(s.id)}
                            className="p-2 rounded-sm text-[#5F5B55] hover:bg-[#FAF8F5] hover:text-[#171717] border border-[rgba(23,23,23,0.1)] transition-colors"
                            title="Audit Activity"
                          >
                            <Activity className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Col: Cryptographic Safeguards */}
              <div className="rounded-sm border border-[rgba(23,23,23,0.12)] bg-white p-5 sm:p-6 space-y-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="border-b border-[rgba(23,23,23,0.08)] pb-3">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E43D12]">
                      ASSURANCE SPEC
                    </span>
                    <h2 className="text-sm font-display font-bold uppercase tracking-wider text-[#171717] mt-0.5">
                      Active Defense Primitives
                    </h2>
                  </div>

                  <ul className="mt-4 space-y-3 text-xs text-[#171717]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#34A853] shrink-0" />
                      <span>AES-256-GCM Authenticated Encryption</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#34A853] shrink-0" />
                      <span>Argon2id Salted PBKDF2 Password Hashes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#34A853] shrink-0" />
                      <span>Atomic Download Race Condition Prevention</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#34A853] shrink-0" />
                      <span>Server-Authoritative Clock Expiration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#34A853] shrink-0" />
                      <span>Instant Global Kill Switch Revocation</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-[rgba(23,23,23,0.08)]">
                  <button
                    onClick={() => setCurrentTab('security')}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#171717] py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-black transition-colors"
                  >
                    <Terminal className="h-3.5 w-3.5 text-[#FFA2B6]" />
                    <span>Run Automated Audit Suite</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'files' && (
          <FileManager
            files={files}
            onRefresh={loadData}
            onCreateShare={(selected) => {
              setFilesToShare(selected);
              setShowCreateShare(true);
            }}
            onOpenUpload={() => setShowUpload(true)}
          />
        )}

        {currentTab === 'shares' && (
          <SharesManager
            shares={shares}
            onRefresh={loadData}
            onViewActivity={handleViewActivity}
            onOpenChat={(slug) => setChatShareSlug(slug)}
            onOpenReceiverPortal={handleOpenReceiverSlug}
          />
        )}

        {currentTab === 'security' && <SecurityCenter />}

        {currentTab === 'activity' && (
          <ActivityLog
            initialShareId={activityShareId}
            onBack={() => {
              setActivityShareId(null);
              setCurrentTab('shares');
            }}
          />
        )}

        {currentTab === 'receiver' && receiverSlug && (
          <ReceiverView
            secureShareId={receiverSlug}
            currentUser={user}
            onLoginSuccess={handleLoginSuccess}
            onExit={() => handleTabChange('landing')}
          />
        )}
      </main>

      {/* Global Modals */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl">
            <UploadZone
              onUploadSuccess={handleUploadSuccess}
              onCancel={() => setShowUpload(false)}
            />
          </div>
        </div>
      )}

      {showCreateShare && filesToShare.length > 0 && (
        <CreateShareModal
          files={filesToShare}
          onClose={() => setShowCreateShare(false)}
          onSuccess={handleCreateShareSuccess}
        />
      )}

      {createdShare && (
        <ShareCreatedModal
          share={createdShare}
          onClose={() => setCreatedShare(null)}
          onViewActivity={handleViewActivity}
          onRevoke={handleRevokeShare}
          onOpenReceiverPortal={handleOpenReceiverSlug}
        />
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {chatShareSlug && (
        <ChatModal
          secureShareId={chatShareSlug}
          senderType="SENDER"
          senderName="Owner / Sender"
          onClose={() => setChatShareSlug(null)}
        />
      )}

      {/* Editorial Footer */}
      <footer className="border-t border-[rgba(23,23,23,0.12)] bg-[#EBE9E1] py-6 text-center text-xs text-[#5F5B55]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold uppercase text-[#171717] tracking-tight">VAULTX</span>
            <span>·</span>
            <span>Zero-Trust Ephemeral Sharing Infrastructure</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-[#5F5B55]">
            <span>AES-256-GCM</span>
            <span>·</span>
            <span>ARGON2ID</span>
            <span>·</span>
            <span>ATOMIC MUTEX</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
