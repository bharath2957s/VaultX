import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Terminal,
  Activity
} from 'lucide-react';
import { SecurityEvent, DownloadEvent } from '../types';
import { api } from '../services/api';

interface ActivityLogProps {
  initialShareId?: string | null;
  onBack?: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ initialShareId, onBack }) => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [downloadEvents, setDownloadEvents] = useState<DownloadEvent[]>([]);
  const [receivers, setReceivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (initialShareId) {
        const act = await api.getShareActivity(initialShareId);
        setSecurityEvents(act.securityEvents);
        setDownloadEvents(act.downloadEvents);
        if (act.receivers) setReceivers(act.receivers);
      } else {
        const testRes = await api.listShares();
        if (testRes.shares.length > 0) {
          const act = await api.getShareActivity(testRes.shares[0].id);
          setSecurityEvents(act.securityEvents);
          setDownloadEvents(act.downloadEvents);
          if (act.receivers) setReceivers(act.receivers);
        }
      }
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [initialShareId]);

  const filteredEvents = securityEvents.filter(e => {
    if (filterType !== 'ALL' && e.eventType !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        e.details.toLowerCase().includes(q) ||
        e.eventType.toLowerCase().includes(q) ||
        e.clientIp.includes(q)
      );
    }
    return true;
  });

  const getEventBadge = (eventType: string, success: boolean) => {
    if (!success) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-[#D6536D]">
          <XCircle className="h-3 w-3" />
          {eventType}
        </span>
      );
    }
    if (eventType.includes('REVOKED')) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-[#D6536D]">
          <ShieldAlert className="h-3 w-3" />
          {eventType}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-[#34A853]">
        <CheckCircle2 className="h-3 w-3" />
        {eventType}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[rgba(23,23,23,0.12)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 rounded text-[#5F5B55] hover:bg-[#EBE9E1] hover:text-[#171717] mr-1"
                title="Back to Shares"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#E43D12] font-semibold">
              05 / CHRONOLOGICAL AUDIT TRAIL
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight text-[#171717] leading-none">
            {initialShareId ? 'SHARE AUDIT' : 'TECHNICAL'}<br />
            <span className="text-[#E43D12]">TIMELINE.</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5F5B55] mt-3 max-w-lg leading-relaxed">
            Tamper-evident chronological access logging. Every authorization attempt, file transfer, and failed password is permanently recorded.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 rounded border border-[rgba(23,23,23,0.15)] bg-white px-4 py-2 text-xs font-mono font-semibold uppercase text-[#171717] hover:bg-[#FAF8F5] transition-colors shadow-sm self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#E43D12]' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Audited Receivers Summary */}
      {receivers.length > 0 && (
        <div className="rounded border border-[rgba(23,23,23,0.12)] bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[rgba(23,23,23,0.08)] pb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E43D12]">
              IDENTIFIED RECEIVERS ({receivers.length})
            </span>
            <span className="text-[10px] font-mono text-[#34A853] font-semibold">
              PASSKEY AUTHENTICATED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {receivers.map((rec: any, idx: number) => (
              <div key={idx} className="bg-[#FAF8F5] border border-[rgba(23,23,23,0.1)] p-3 rounded-sm space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#171717] truncate">{rec.userName}</span>
                  <span className="bg-[#34A853]/15 text-[#25793d] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                    {rec.downloadCount} dl
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[#5F5B55] truncate">{rec.userEmail}</div>
                <div className="text-[10px] font-mono text-[#5F5B55] pt-1 border-t border-[rgba(23,23,23,0.06)] flex items-center justify-between">
                  <span>Visits: {rec.accessCount}</span>
                  <span>IP: {rec.clientIp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded border border-[rgba(23,23,23,0.12)] bg-white p-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#5F5B55]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events, client IP, or parameters..."
            className="w-full rounded border border-[rgba(23,23,23,0.15)] bg-[#FAF8F5] pl-9 pr-4 py-1.5 text-xs text-[#171717] placeholder-[#5F5B55] focus:border-[#E43D12] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[#5F5B55]" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded border border-[rgba(23,23,23,0.15)] bg-[#FAF8F5] px-3 py-1.5 text-xs font-mono text-[#171717] focus:border-[#E43D12] focus:outline-none"
          >
            <option value="ALL">ALL EVENT TYPES</option>
            <option value="PASSWORD_SUCCESS">PASSWORD_SUCCESS</option>
            <option value="PASSWORD_FAILED">PASSWORD_FAILED</option>
            <option value="FILE_DOWNLOADED">FILE_DOWNLOADED</option>
            <option value="MULTI_FILE_DOWNLOAD">MULTI_FILE_DOWNLOAD</option>
            <option value="LINK_REVOKED">LINK_REVOKED</option>
            <option value="INVALID_TOKEN">INVALID_TOKEN</option>
            <option value="SUSPICIOUS_ACCESS">SUSPICIOUS_ACCESS</option>
            <option value="CHAT_MESSAGE_SENT">CHAT_MESSAGE_SENT</option>
          </select>
        </div>
      </div>

      {/* Technical Vertical Timeline (Section 13) */}
      {filteredEvents.length === 0 ? (
        <div className="rounded border-2 border-dashed border-[rgba(23,23,23,0.15)] bg-white/60 p-12 text-center">
          <Terminal className="mx-auto h-10 w-10 text-[#5F5B55]/50" />
          <h3 className="mt-3 text-sm font-display font-bold uppercase tracking-wider text-[#171717]">
            No audit records
          </h3>
          <p className="mt-1 text-xs text-[#5F5B55]">
            {searchTerm || filterType !== 'ALL' ? 'No events match your active filter.' : 'Events will stream here as shares and downloads occur.'}
          </p>
        </div>
      ) : (
        <div className="rounded border border-[rgba(23,23,23,0.12)] bg-white shadow-sm p-6 sm:p-8">
          <div className="relative border-l-2 border-[#171717]/10 ml-4 sm:ml-20 space-y-6">
            {filteredEvents.map((event) => {
              const dateObj = new Date(event.timestamp);
              const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              return (
                <div key={event.id} className="relative pl-6 sm:pl-8 group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[5px] top-1.5 h-2 w-2 rounded-full border border-white ${
                    !event.success ? 'bg-[#D6536D]' : event.eventType.includes('REVOKED') ? 'bg-[#E43D12]' : 'bg-[#171717]'
                  }`} />

                  {/* Desktop Time Display on Left */}
                  <span className="hidden sm:block absolute -left-20 top-1 text-[11px] font-mono font-bold text-[#5F5B55] tabular-nums">
                    {timeString}
                  </span>

                  {/* Event Details Card */}
                  <div className="rounded border border-[rgba(23,23,23,0.08)] bg-[#FAF8F5] p-4 transition-all hover:border-[#171717]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="sm:hidden font-mono text-[10px] font-bold text-[#5F5B55]">
                          {timeString}
                        </span>
                        {getEventBadge(event.eventType, event.success)}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-mono text-[#5F5B55]">
                        <span>IP: <strong className="text-[#171717]">{event.clientIp}</strong></span>
                        {event.riskScore > 0 && (
                          <span className="text-[#D6536D] font-bold">RISK: +{event.riskScore}</span>
                        )}
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-[#171717] font-mono leading-relaxed">
                      {event.details}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
