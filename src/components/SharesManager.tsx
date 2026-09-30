import React, { useState } from 'react';
import {
  Link as LinkIcon,
  Copy,
  Check,
  AlertOctagon,
  Activity,
  MessageSquare,
  Lock,
  ExternalLink,
  Search,
  CheckCircle2,
  X,
  Users,
  UserCheck,
  Clock,
  Download,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { ShareRecord, ReceiverAccessRecord } from '../types';
import { api } from '../services/api';

interface SharesManagerProps {
  shares: ShareRecord[];
  onRefresh: () => void;
  onViewActivity: (shareId: string) => void;
  onOpenChat: (secureShareId: string) => void;
  onOpenReceiverPortal: (slug: string) => void;
}

export const SharesManager: React.FC<SharesManagerProps> = ({
  shares,
  onRefresh,
  onViewActivity,
  onOpenChat,
  onOpenReceiverPortal
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [shareToRevoke, setShareToRevoke] = useState<ShareRecord | null>(null);
  const [selectedShareForReceivers, setSelectedShareForReceivers] = useState<ShareRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCopy = (share: ShareRecord) => {
    const fullUrl = `${window.location.origin}/s/${share.secureShareId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmRevoke = async () => {
    if (!shareToRevoke) return;
    const shareId = shareToRevoke.id;
    const slug = shareToRevoke.secureShareId;
    setRevokingId(shareId);
    try {
      await api.revokeShare(shareId);
      setToastMessage(`Share link /s/${slug} was immediately revoked.`);
      setTimeout(() => setToastMessage(null), 4000);
      setShareToRevoke(null);
      onRefresh();
    } catch (err: any) {
      setToastMessage(`Error: ${err.message || 'Failed to revoke link'}`);
    } finally {
      setRevokingId(null);
    }
  };

  const filtered = shares.filter(s => {
    if (filter === 'ACTIVE' && s.status !== 'ACTIVE') return false;
    if (filter === 'REVOKED' && s.status !== 'REVOKED') return false;
    if (filter === 'EXPIRED' && s.status !== 'EXPIRED' && s.status !== 'LIMIT_REACHED') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const slugMatch = s.secureShareId.toLowerCase().includes(q);
      const receiverMatch = s.receivers?.some(r => r.userName.toLowerCase().includes(q) || r.userEmail.toLowerCase().includes(q));
      return slugMatch || receiverMatch;
    }
    return true;
  });

  const getStatusBadge = (share: ShareRecord) => {
    const now = Date.now();
    const isPast = now > share.expiresAt;

    if (share.status === 'REVOKED') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#D6536D]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D6536D]" />
          REVOKED
        </span>
      );
    }

    if (share.status === 'LIMIT_REACHED' || (share.maxDownloads > 0 && share.downloadCount >= share.maxDownloads)) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#EFB11D]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#EFB11D]" />
          LIMIT REACHED
        </span>
      );
    }

    if (share.status === 'EXPIRED' || isPast) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#5F5B55]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5F5B55]" />
          EXPIRED
        </span>
      );
    }

    const diff = Math.max(0, share.expiresAt - now);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#34A853]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#34A853] animate-pulse" />
        ACTIVE ({hours}h {mins}m)
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center gap-2 rounded border border-[rgba(23,23,23,0.12)] bg-white p-4 text-xs text-[#171717] shadow-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#34A853]" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[rgba(23,23,23,0.12)]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#E43D12] font-semibold block mb-2">
            03 / ACCESS GOVERNANCE & RECEIVER TRACKING
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight text-[#171717] leading-none">
            SHARED<br />
            <span className="text-[#E43D12]">LINKS.</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5F5B55] mt-3 max-w-lg leading-relaxed">
            Server-enforced access policies. Monitor authenticated receivers, download counts, and execute instant global kill switch revocation.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] border border-[rgba(23,23,23,0.12)] rounded">
          {(['ALL', 'ACTIVE', 'EXPIRED', 'REVOKED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-mono font-semibold uppercase rounded transition-colors ${
                filter === tab ? 'bg-white text-[#E43D12] shadow-sm' : 'text-[#5F5B55] hover:text-[#171717]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#5F5B55]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by slug or receiver name/email..."
          className="w-full rounded border border-[rgba(23,23,23,0.15)] bg-white pl-9 pr-4 py-2 text-xs text-[#171717] placeholder-[#5F5B55] focus:border-[#E43D12] focus:outline-none shadow-sm"
        />
      </div>

      {/* Shares List */}
      {filtered.length === 0 ? (
        <div className="rounded border-2 border-dashed border-[rgba(23,23,23,0.15)] bg-white/60 p-12 text-center">
          <LinkIcon className="mx-auto h-10 w-10 text-[#5F5B55]/50" />
          <h3 className="mt-3 text-sm font-display font-bold uppercase tracking-wider text-[#171717]">
            No shares found
          </h3>
          <p className="mt-1 text-xs text-[#5F5B55]">
            {searchTerm || filter !== 'ALL' ? 'No shares match your active filter.' : 'Upload files and create a secure share to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((share) => {
            const isCopied = copiedId === share.id;
            const receivers = share.receivers || [];
            return (
              <div
                key={share.id}
                className="rounded border border-[rgba(23,23,23,0.12)] bg-white p-5 transition-all hover:border-[#171717] shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Share Identity */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm font-bold text-[#171717]">
                        /s/<span className="text-[#E43D12]">{share.secureShareId}</span>
                      </span>
                      {getStatusBadge(share)}
                      {share.hasPassword && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#EFB11D] font-bold">
                          <Lock className="h-3 w-3" /> PASS-PROTECTED
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#5F5B55]">
                      <span>
                        FILES: <strong className="text-[#171717]">{share.fileCount}</strong>
                      </span>
                      <span className="text-[rgba(23,23,23,0.15)]">|</span>
                      <span>
                        DOWNLOADS:{' '}
                        <strong className="text-[#171717]">
                          {share.downloadCount} / {share.maxDownloads > 0 ? share.maxDownloads : '∞'}
                        </strong>
                      </span>
                      <span className="text-[rgba(23,23,23,0.15)]">|</span>
                      <span>
                        POSTURE: <strong className="text-[#E43D12]">{share.securityScore}%</strong>
                      </span>
                      <span className="text-[rgba(23,23,23,0.15)]">|</span>
                      <span>CREATED: {new Date(share.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => handleCopy(share)}
                      className="inline-flex items-center gap-1.5 rounded border border-[rgba(23,23,23,0.15)] bg-[#FAF8F5] px-3 py-1.5 text-xs font-mono font-semibold uppercase text-[#171717] hover:bg-[#EBE9E1] transition-colors"
                      title="Copy Public Link"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-[#34A853]" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{isCopied ? 'COPIED' : 'COPY'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedShareForReceivers(share)}
                      className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors ${
                        receivers.length > 0
                          ? 'border-[#34A853]/40 bg-[#34A853]/10 text-[#25793d] hover:bg-[#34A853]/20'
                          : 'border-[rgba(23,23,23,0.15)] bg-[#FAF8F5] text-[#5F5B55] hover:bg-[#EBE9E1] hover:text-[#171717]'
                      }`}
                      title="View Receivers who accessed this link"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>RECEIVERS ({receivers.length})</span>
                    </button>

                    <button
                      onClick={() => onOpenReceiverPortal(share.secureShareId)}
                      className="inline-flex items-center gap-1.5 rounded border border-[rgba(23,23,23,0.15)] bg-[#FAF8F5] px-3 py-1.5 text-xs font-mono font-semibold uppercase text-[#171717] hover:bg-[#EBE9E1] hover:text-[#E43D12] transition-colors"
                      title="Open Receiver View"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>PORTAL</span>
                    </button>

                    <button
                      onClick={() => onOpenChat(share.secureShareId)}
                      className="inline-flex items-center gap-1.5 rounded border border-[rgba(23,23,23,0.15)] bg-[#FAF8F5] px-3 py-1.5 text-xs font-mono font-semibold uppercase text-[#171717] hover:bg-[#EBE9E1] hover:text-[#E43D12] transition-colors"
                      title="Open Secure Text Chat"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>CHAT</span>
                    </button>

                    <button
                      onClick={() => onViewActivity(share.id)}
                      className="inline-flex items-center gap-1.5 rounded border border-[rgba(23,23,23,0.15)] bg-[#FAF8F5] px-3 py-1.5 text-xs font-mono font-semibold uppercase text-[#171717] hover:bg-[#EBE9E1] transition-colors"
                      title="Inspect Audit Logs"
                    >
                      <Activity className="h-3.5 w-3.5" />
                      <span>AUDIT</span>
                    </button>

                    {share.status === 'ACTIVE' && (
                      <button
                        onClick={() => setShareToRevoke(share)}
                        disabled={revokingId === share.id}
                        className="inline-flex items-center gap-1 rounded bg-[#D6536D]/10 border border-[#D6536D]/30 px-3 py-1.5 text-xs font-mono font-bold uppercase text-[#D6536D] hover:bg-[#D6536D] hover:text-white transition-all"
                        title="Instant Server-Side Kill Switch"
                      >
                        <AlertOctagon className="h-3.5 w-3.5" />
                        <span>REVOKE</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Receiver Access Quick Ribbon */}
                <div className="pt-2.5 border-t border-[rgba(23,23,23,0.06)] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#5F5B55]">
                      Audited Receivers:
                    </span>
                    {receivers.length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {receivers.slice(0, 3).map((r, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedShareForReceivers(share)}
                            className="inline-flex items-center gap-1.5 rounded-sm bg-[#FAF8F5] border border-[rgba(23,23,23,0.15)] px-2 py-0.5 text-[11px] font-mono text-[#171717] hover:border-[#E43D12] transition-colors"
                          >
                            <UserCheck className="h-3 w-3 text-[#34A853]" />
                            <span className="font-bold">{r.userName}</span>
                            <span className="text-[#5F5B55]">({r.userEmail})</span>
                            <span className="bg-[#34A853]/15 text-[#25793d] px-1 rounded-sm text-[9px] font-bold">
                              {r.downloadCount} dl
                            </span>
                          </button>
                        ))}
                        {receivers.length > 3 && (
                          <button
                            onClick={() => setSelectedShareForReceivers(share)}
                            className="text-[11px] font-mono text-[#E43D12] underline"
                          >
                            +{receivers.length - 3} more
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-[#5F5B55] italic">
                        No receiver has accessed this link yet
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-[#5F5B55]">
                    Requires receiver login 1st • Passkey protected
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Receiver Access Audit Modal */}
      {selectedShareForReceivers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-sm border border-[rgba(23,23,23,0.2)] bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(23,23,23,0.1)]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#E43D12] font-semibold block mb-1">
                  SENDER AUDIT • RECEIVER DETAILS
                </span>
                <h2 className="text-xl font-display font-extrabold uppercase tracking-tight text-[#171717]">
                  Verified Access Log for /s/{selectedShareForReceivers.secureShareId}
                </h2>
                <p className="text-xs text-[#5F5B55] mt-0.5">
                  Accounts that logged in, entered the passkey, and accessed or downloaded files.
                </p>
              </div>
              <button
                onClick={() => setSelectedShareForReceivers(null)}
                className="text-[#5F5B55] hover:text-[#171717] p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {(!selectedShareForReceivers.receivers || selectedShareForReceivers.receivers.length === 0) ? (
                <div className="p-8 text-center border-2 border-dashed border-[rgba(23,23,23,0.1)] rounded-sm bg-[#FAF8F5]">
                  <Users className="mx-auto h-8 w-8 text-[#5F5B55]/50 mb-2" />
                  <p className="text-xs font-mono uppercase text-[#171717] font-bold">
                    No receivers have accessed this link yet
                  </p>
                  <p className="text-[11px] text-[#5F5B55] mt-1">
                    When a recipient opens the link and logs in with their email or Google account, their identity, IP, access counts, and downloads will be displayed here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[rgba(23,23,23,0.08)] border border-[rgba(23,23,23,0.12)] rounded-sm overflow-hidden">
                  {selectedShareForReceivers.receivers.map((rec, idx) => (
                    <div key={idx} className="p-4 bg-white hover:bg-[#FAF8F5] transition-colors space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#171717] text-[#FFA2B6] font-mono font-bold text-xs">
                            {rec.userName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#171717]">{rec.userName}</span>
                              <span className="inline-flex items-center gap-1 rounded bg-[#34A853]/10 text-[#25793d] px-2 py-0.5 text-[10px] font-mono font-bold">
                                <CheckCircle2 className="h-3 w-3" /> VERIFIED
                              </span>
                            </div>
                            <span className="text-xs font-mono text-[#5F5B55]">{rec.userEmail}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            onClick={() => {
                              onOpenChat(selectedShareForReceivers.secureShareId);
                              setSelectedShareForReceivers(null);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-sm border border-[rgba(23,23,23,0.15)] bg-white px-3 py-1.5 text-xs font-mono font-bold uppercase text-[#171717] hover:border-[#E43D12] hover:text-[#E43D12]"
                          >
                            <MessageSquare className="h-3 w-3 text-[#E43D12]" />
                            <span>Chat</span>
                          </button>
                        </div>
                      </div>

                      {/* Technical Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[rgba(23,23,23,0.06)] text-[11px] font-mono">
                        <div className="bg-[#FAF8F5] p-2 rounded-sm border border-[rgba(23,23,23,0.08)]">
                          <span className="text-[10px] text-[#5F5B55] uppercase block">Downloads:</span>
                          <span className="font-bold text-[#E43D12] text-sm">{rec.downloadCount}</span>
                        </div>

                        <div className="bg-[#FAF8F5] p-2 rounded-sm border border-[rgba(23,23,23,0.08)]">
                          <span className="text-[10px] text-[#5F5B55] uppercase block">Visits / Accesses:</span>
                          <span className="font-bold text-[#171717] text-sm">{rec.accessCount}</span>
                        </div>

                        <div className="bg-[#FAF8F5] p-2 rounded-sm border border-[rgba(23,23,23,0.08)]">
                          <span className="text-[10px] text-[#5F5B55] uppercase block">First Access:</span>
                          <span className="text-[#171717] block truncate">{new Date(rec.firstAccessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className="bg-[#FAF8F5] p-2 rounded-sm border border-[rgba(23,23,23,0.08)]">
                          <span className="text-[10px] text-[#5F5B55] uppercase block">Last Access:</span>
                          <span className="text-[#171717] block truncate">{new Date(rec.lastAccessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-[#5F5B55] pt-1">
                        <span>IP Address: <strong>{rec.clientIp}</strong></span>
                        <span className="text-[#34A853] font-bold">PASSKEY AUTHENTICATED</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[rgba(23,23,23,0.1)] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedShareForReceivers(null)}
                className="rounded-sm bg-[#171717] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-black transition-colors"
              >
                Close Audit Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revocation Confirmation Modal */}
      {shareToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded border border-[rgba(23,23,23,0.2)] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,23,23,0.1)]">
              <div className="flex items-center gap-2 text-[#E43D12]">
                <AlertOctagon className="h-5 w-5" />
                <h3 className="font-display font-bold text-sm text-[#171717] uppercase tracking-wider">
                  Execute Instant Kill Switch?
                </h3>
              </div>
              <button
                onClick={() => setShareToRevoke(null)}
                className="text-[#5F5B55] hover:text-[#171717] p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-xs text-[#5F5B55]">
              <p>
                Are you sure you want to revoke <strong className="font-mono text-[#E43D12]">/s/{shareToRevoke.secureShareId}</strong>?
              </p>
              <p className="leading-relaxed">
                All future downloads and receiver access attempts will be rejected server-side immediately. This cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-[rgba(23,23,23,0.1)]">
              <button
                type="button"
                onClick={() => setShareToRevoke(null)}
                className="rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#5F5B55] hover:text-[#171717] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRevoke}
                disabled={revokingId === shareToRevoke.id}
                className="inline-flex items-center gap-1.5 rounded bg-[#E43D12] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c9330d] disabled:opacity-50 transition-colors shadow-sm"
              >
                <AlertOctagon className="h-3.5 w-3.5" />
                <span>{revokingId === shareToRevoke.id ? 'Revoking...' : 'Yes, Revoke Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
