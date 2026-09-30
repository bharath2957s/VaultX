import React, { useState, useEffect } from 'react';
import { Check, Copy, QrCode, ExternalLink, AlertOctagon, Activity, X } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { ShareRecord } from '../types';

interface ShareCreatedModalProps {
  share: ShareRecord;
  onClose: () => void;
  onViewActivity: (shareId: string) => void;
  onRevoke: (shareId: string) => void;
  onOpenReceiverPortal: (slug: string) => void;
}

export const ShareCreatedModal: React.FC<ShareCreatedModalProps> = ({
  share,
  onClose,
  onViewActivity,
  onRevoke,
  onOpenReceiverPortal
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const fullUrl = `${window.location.origin}/s/${share.secureShareId}`;

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, share.expiresAt - now);
      if (diff === 0) {
        setTimeLeft('EXPIRED');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [share.expiresAt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleQr = async () => {
    if (!qrDataUrl) {
      try {
        const url = await QRCodeLib.toDataURL(fullUrl, {
          width: 240,
          margin: 2,
          color: { dark: '#171717', light: '#FFFFFF' }
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('QR code generation failed:', err);
      }
    }
    setShowQr(!showQr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded border border-[rgba(23,23,23,0.15)] bg-white p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(23,23,23,0.1)]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#E43D12] font-semibold block mb-1">
              04 / LINK PUBLISHED
            </span>
            <h2 className="text-xl font-display font-bold uppercase tracking-tight text-[#171717]">
              Secure Share Created
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#5F5B55] hover:bg-[#EBE9E1] hover:text-[#171717] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Share Link Box */}
        <div className="mt-5 space-y-2">
          <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#5F5B55]">
            Cryptographically Random Access Link
          </label>
          <div className="flex items-center gap-2 rounded border border-[rgba(23,23,23,0.15)] bg-[#FAF8F5] p-2">
            <input
              type="text"
              readOnly
              value={fullUrl}
              className="w-full bg-transparent font-mono text-xs text-[#171717] font-semibold focus:outline-none selection:bg-[#E43D12] selection:text-white"
            />
            <button
              onClick={handleCopy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded bg-[#E43D12] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c9330d] transition-colors shadow-sm"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={toggleQr}
              className="rounded border border-[rgba(23,23,23,0.15)] bg-white p-1.5 text-[#5F5B55] hover:text-[#171717] hover:border-[#171717] transition-colors"
              title="View QR Code"
            >
              <QrCode className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* QR Code Container */}
        {showQr && qrDataUrl && (
          <div className="mt-4 flex flex-col items-center justify-center rounded border border-[rgba(23,23,23,0.12)] bg-[#FAF8F5] p-4">
            <img src={qrDataUrl} alt="QR Code" className="h-40 w-40 rounded border border-[rgba(23,23,23,0.1)] shadow-sm" />
            <span className="mt-2 text-[10px] font-mono text-[#5F5B55] uppercase">
              Scan to open on mobile
            </span>
          </div>
        )}

        {/* Share Metrics Grid */}
        <div className="mt-5 grid grid-cols-3 gap-2.5 text-center">
          <div className="rounded border border-[rgba(23,23,23,0.1)] bg-[#FAF8F5] p-3">
            <span className="block text-[9px] font-mono uppercase font-bold text-[#5F5B55]">Expires In</span>
            <span className="mt-1 block font-mono text-xs font-bold text-[#E43D12] tabular-nums">
              {timeLeft}
            </span>
          </div>

          <div className="rounded border border-[rgba(23,23,23,0.1)] bg-[#FAF8F5] p-3">
            <span className="block text-[9px] font-mono uppercase font-bold text-[#5F5B55]">Downloads</span>
            <span className="mt-1 block font-mono text-xs font-bold text-[#171717] tabular-nums">
              {share.downloadCount} / {share.maxDownloads > 0 ? share.maxDownloads : '∞'}
            </span>
          </div>

          <div className="rounded border border-[rgba(23,23,23,0.1)] bg-[#FAF8F5] p-3">
            <span className="block text-[9px] font-mono uppercase font-bold text-[#5F5B55]">Posture</span>
            <span className="mt-1 block font-mono text-xs font-bold text-[#34A853] tabular-nums">
              {share.securityScore}%
            </span>
          </div>
        </div>

        {share.otpPreview && (
          <div className="mt-4 rounded border border-[#EFB11D]/30 bg-[#EFB11D]/10 p-3 text-xs text-[#171717]">
            <span className="font-bold">DEMO OTP CODE: </span>
            <span className="font-mono font-bold tracking-widest text-[#E43D12]">{share.otpPreview}</span>
            <span className="text-[10px] text-[#5F5B55] block mt-0.5 font-mono">
              (Simulated email/SMS token preview)
            </span>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 pt-4 border-t border-[rgba(23,23,23,0.1)]">
          <button
            onClick={() => onOpenReceiverPortal(share.secureShareId)}
            className="w-full inline-flex items-center justify-center gap-2 rounded bg-[#E43D12] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c9330d] transition-colors shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Receiver Portal</span>
          </button>

          <button
            onClick={() => onViewActivity(share.id)}
            className="w-full inline-flex items-center justify-center gap-2 rounded border border-[rgba(23,23,23,0.15)] bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#171717] hover:bg-[#FAF8F5] transition-colors"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Audit</span>
          </button>

          <button
            onClick={() => onRevoke(share.id)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded bg-[#D6536D]/10 border border-[#D6536D]/30 px-3.5 py-2.5 text-xs font-mono font-bold uppercase text-[#D6536D] hover:bg-[#D6536D] hover:text-white transition-colors"
            title="Instant Kill Switch"
          >
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>Revoke</span>
          </button>
        </div>
      </div>
    </div>
  );
};
