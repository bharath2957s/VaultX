import React from 'react';
import {
  Lock,
  Clock,
  AlertOctagon,
  Activity,
  KeyRound,
  Cpu,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Shield,
  FileCheck,
  ChevronRight
} from 'lucide-react';

interface LandingHeroProps {
  onStartSharing: () => void;
  onOpenDemo: () => void;
  onNavigateTab: (tab: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartSharing,
  onOpenDemo,
  onNavigateTab
}) => {
  const securityPipeline = [
    { step: '01', title: 'CLIENT INGEST', desc: 'Local memory read, isolated DEK generation' },
    { step: '02', title: 'AES-256-GCM', desc: 'Authenticated ciphertext + 128-bit integrity tag' },
    { step: '03', title: 'CSPRNG SLUG', desc: '128-bit unguessable high-entropy URL identifier' },
    { step: '04', title: 'POLICY ENGINE', desc: 'Atomic download mutex & authoritative clock expiry' },
    { step: '05', title: 'AUTHENTICATE', desc: 'Argon2id salted hash + brute-force lockout guard' },
    { step: '06', title: 'ATOMIC DECRYPT', desc: 'Decryption on-the-fly with stream SHA-256 verify' },
    { step: '07', title: 'IMMUTABLE AUDIT', desc: 'Granular client IP, event type, and risk logging' }
  ];

  const features = [
    {
      code: 'ENC-01',
      title: 'AES-256-GCM Authenticated Cipher',
      desc: 'Every file is sealed with an isolated per-file Data Encryption Key (DEK). Ciphertext tampering is rejected in zero milliseconds via cryptographic authentication tags.',
      color: '#E43D12',
      tag: 'AUTHENTICATED'
    },
    {
      code: 'EXP-02',
      title: 'Server-Enforced Expiring Links',
      desc: 'Strict server clock TTL ranging from 15 minutes to 7 days. Client clocks are untrusted. Upon expiration, access tokens are cryptographically rejected.',
      color: '#EFB11D',
      tag: 'EPHEMERAL'
    },
    {
      code: 'REV-03',
      title: 'Instant Global Revocation',
      desc: 'Owner kill switch terminates any share link in real-time. Instantly cancels all active download sessions and blocks subsequent ingress.',
      color: '#D6536D',
      tag: 'KILL SWITCH'
    },
    {
      code: 'AUD-04',
      title: 'Real-Time Access Audit Logs',
      desc: 'Detailed chronological timeline of download events, failed passphrase attempts, client IP prefixes, user-agent fingerprints, and risk scores.',
      color: '#171717',
      tag: 'IMMUTABLE'
    },
    {
      code: 'PWD-05',
      title: 'Argon2id Passphrase Hardening',
      desc: 'High-memory cost password derivation with 100k salted rounds. Automatically triggers an exponential 15-minute lockout on repeated failed attempts.',
      color: '#E43D12',
      tag: 'HARDENED'
    },
    {
      code: 'CMP-06',
      title: 'Lossless Compression Engine',
      desc: 'Evaluates file headers and size thresholds. Automatically detects and compresses uncompressed text/documents losslessly while skipping JPEG/MP4.',
      color: '#5F5B55',
      tag: 'INTELLIGENT'
    },
    {
      code: 'CHT-07',
      title: 'Encrypted Zero-Attachment Chat',
      desc: 'Isolated textual communication channel between sender and recipient. Strips all binaries, script injections, and data payloads for strict safety.',
      color: '#FFA2B6',
      tag: 'TEXT-ONLY'
    }
  ];

  return (
    <div className="space-y-16 py-4 sm:py-8">
      {/* 1. Asymmetric Editorial Hero Banner (Section 3 & 4) */}
      <section className="relative border-b border-[rgba(23,23,23,0.12)] pb-12 pt-4">
        {/* Background Decorative Technical Index */}
        <div
          aria-hidden="true"
          className="absolute -right-6 -top-6 select-none opacity-5 pointer-events-none hidden md:block text-[140px] font-display font-extrabold leading-none text-[#171717]"
        >
          VAULTX
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Bold Asymmetric Typography */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#171717] px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E43D12] animate-pulse" />
                ZERO-TRUST PROTOCOL V2.4
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#5F5B55]">
                AES-256-GCM • ATOMIC MUTEX • ARGON2ID
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-[#171717] uppercase leading-[0.95]">
                SHARE THE FILE.<br />
                <span className="text-[#E43D12]">KEEP CONTROL.</span>
              </h1>
              <p className="text-base sm:text-lg text-[#5F5B55] max-w-2xl leading-relaxed pt-2">
                Military-grade ephemeral file sharing with server-enforced download counters, time-to-live policies, cryptographic integrity checks, and instant owner revocation.
              </p>
            </div>

            {/* Editorial CTAs (Section 17) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={onStartSharing}
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#E43D12] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-[#c9330d] active:scale-[0.98]"
              >
                <span>Upload & Secure Share</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={onOpenDemo}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-[rgba(23,23,23,0.2)] bg-white px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-[#171717] transition-all hover:border-[#171717] hover:bg-[#FAF8F5]"
              >
                <Lock className="h-3.5 w-3.5 text-[#E43D12]" />
                <span>Open Receiver Demo</span>
              </button>

              <button
                onClick={() => onNavigateTab('security')}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-[#5F5B55] hover:text-[#171717] transition-colors"
              >
                <span>Security Audit</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Visual Security Card (Section 10) */}
          <div className="lg:col-span-4 bg-white border border-[rgba(23,23,23,0.12)] p-6 rounded-sm shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[rgba(23,23,23,0.1)] pb-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E43D12]">
                STATUS / ACTIVE
              </span>
              <span className="text-[10px] font-mono text-[#5F5B55]">SYS: VERIFIED</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[rgba(23,23,23,0.06)]">
                <span className="text-[#5F5B55]">ENCRYPTION</span>
                <span className="font-bold text-[#171717] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34A853]" />
                  AES-256-GCM
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[rgba(23,23,23,0.06)]">
                <span className="text-[#5F5B55]">ACCESS CONTROL</span>
                <span className="font-bold text-[#171717] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34A853]" />
                  ATOMIC MUTEX
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[rgba(23,23,23,0.06)]">
                <span className="text-[#5F5B55]">EXPIRY POLICIES</span>
                <span className="font-bold text-[#171717] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34A853]" />
                  AUTHORITATIVE
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[rgba(23,23,23,0.06)]">
                <span className="text-[#5F5B55]">AUDIT LOG</span>
                <span className="font-bold text-[#171717] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34A853]" />
                  IMMUTABLE
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#5F5B55]">ZERO TRUST</span>
                <span className="font-bold text-[#E43D12] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E43D12]" />
                  ACTIVE ENFORCED
                </span>
              </div>
            </div>

            <div className="pt-2">
              <div className="bg-[#FAF8F5] border border-[rgba(23,23,23,0.1)] p-3 rounded-sm text-[11px] text-[#5F5B55] leading-relaxed">
                <p className="font-mono text-[10px] text-[#171717] font-bold uppercase mb-1">
                  Zero Data Exfiltration
                </p>
                Recipients receive isolated, verified decrypt streams. Raw file paths are never exposed.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Zero-Trust Pipeline Timeline (Section 13 & 50) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[rgba(23,23,23,0.12)] pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#E43D12] font-semibold block mb-1">
              CHRONOLOGY & INTEGRITY
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-[#171717]">
              The Zero-Trust Pipeline
            </h2>
          </div>
          <span className="font-mono text-xs text-[#5F5B55]">
            ALL STAGES VERIFIED SERVER-SIDE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {securityPipeline.map((item) => (
            <div
              key={item.step}
              className="bg-white border border-[rgba(23,23,23,0.12)] p-4 rounded-sm hover:border-[#E43D12] transition-colors relative group"
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#E43D12] mb-3">
                <span>{item.step}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#E43D12]/40 group-hover:bg-[#E43D12]" />
              </div>
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#171717] leading-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-[11px] text-[#5F5B55] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Core Security Controls Grid (Section 10 & 12) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[rgba(23,23,23,0.12)] pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#E43D12] font-semibold block mb-1">
              CRYPTOGRAPHIC SPECIFICATION
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-[#171717]">
              Security by Design
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('security')}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#E43D12] hover:underline"
          >
            <span>View Complete Threat Model</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feat) => (
            <div
              key={feat.code}
              className="bg-white border border-[rgba(23,23,23,0.12)] p-5 rounded-sm hover:border-[rgba(23,23,23,0.3)] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] font-bold text-[#5F5B55]">
                    {feat.code}
                  </span>
                  <span
                    className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
                    style={{ backgroundColor: `${feat.color}15`, color: feat.color }}
                  >
                    {feat.tag}
                  </span>
                </div>
                <h3 className="font-display font-bold text-sm uppercase text-[#171717]">
                  {feat.title}
                </h3>
                <p className="mt-2 text-xs text-[#5F5B55] leading-relaxed">
                  {feat.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[rgba(23,23,23,0.06)] flex items-center justify-between text-[11px] font-mono text-[#5F5B55]">
                <span>STATUS</span>
                <span className="text-[#34A853] font-bold">ENFORCED</span>
              </div>
            </div>
          ))}

          {/* Interactive Audit CTA Card */}
          <div className="bg-[#171717] text-white border border-[#171717] p-5 rounded-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] font-bold text-[#FFA2B6]">AUD-VERIFIED</span>
                <Terminal className="h-4 w-4 text-[#FFA2B6]" />
              </div>
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
                Automated Test Suite
              </h3>
              <p className="mt-2 text-xs text-stone-300 leading-relaxed">
                Run live cryptographic verification tests against AES-256-GCM tamper detection, atomic limits, and hash integrity directly in browser.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-stone-800">
              <button
                onClick={() => onNavigateTab('security')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#E43D12] py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#c9330d] transition-colors"
              >
                <span>Launch Test Suite</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
