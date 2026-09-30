import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, ShieldCheck, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { api } from '../services/api';

interface ChatModalProps {
  secureShareId: string;
  senderType: 'SENDER' | 'RECEIVER';
  senderName: string;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  secureShareId,
  senderType,
  senderName,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await api.getChatMessages(secureShareId);
      setMessages(res.messages || []);
      setLastUpdated(Date.now());
    } catch (err: any) {
      console.warn('Failed to load chat messages:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Live polling for instant real-time feel
    const interval = setInterval(fetchMessages, 1200);
    return () => clearInterval(interval);
  }, [secureShareId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputText;
    if (!textToSend.trim() || sending) return;

    // Strict zero-attachment check
    if (textToSend.startsWith('data:') || textToSend.includes('base64,')) {
      setError('File and binary attachments are strictly prohibited in VaultX secure chat');
      return;
    }

    setSending(true);
    setError(null);
    try {
      await api.sendChatMessage(secureShareId, textToSend, senderType, senderName);
      if (!customText) setInputText('');
      await fetchMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const quickPrompts = senderType === 'SENDER'
    ? ['Please verify all files open correctly.', 'I have uploaded an updated version.', 'Let me know if you need any assistance.']
    : ['Files decrypted and verified.', 'Everything downloaded successfully, thanks!', 'Could you check file #2?'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex h-[620px] w-full max-w-lg flex-col rounded-sm border border-[rgba(23,23,23,0.15)] bg-white shadow-2xl overflow-hidden">
        {/* Editorial Top Bar (Section 15) */}
        <div className="flex items-center justify-between border-b border-[rgba(23,23,23,0.12)] p-4 bg-[#FAF8F5]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E43D12]">
                SECURE CHANNEL
              </span>
              <span className="text-[10px] font-mono text-[#5F5B55]">/s/{secureShareId}</span>
            </div>
            <h2 className="text-sm font-display font-extrabold uppercase tracking-tight text-[#171717]">
              End-to-End Protected
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#34A853]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34A853] animate-pulse" />
              LIVE
            </span>
            <button
              onClick={onClose}
              className="rounded p-1 text-[#5F5B55] hover:bg-[#EBE9E1] hover:text-[#171717] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Identity & Policy Ribbon */}
        <div className="flex items-center justify-between border-b border-[rgba(23,23,23,0.08)] bg-white px-4 py-2 text-[11px] font-mono text-[#5F5B55]">
          <div className="flex items-center gap-1.5">
            <span>Identity:</span>
            <span className="font-bold text-[#171717]">
              {senderName} ({senderType === 'SENDER' ? 'Owner' : 'Recipient'})
            </span>
          </div>
          <span className="text-[10px] uppercase text-[#E43D12] font-semibold">
            Zero-Attachment Safe
          </span>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#FAF8F5]/50">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-[#5F5B55]">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#EBE9E1] text-[#E43D12] mb-3">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold uppercase text-xs text-[#171717]">
                Channel Initialized
              </h3>
              <p className="text-xs text-[#5F5B55] mt-1 max-w-xs leading-relaxed">
                Direct secure messages between the document owner and verified recipient. All exchanges are logged for audit compliance.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderType === senderType;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#5F5B55] mb-1">
                    <span className="font-bold text-[#171717]">
                      {isMe ? 'You' : m.senderName}
                    </span>
                    <span>•</span>
                    <span className="tabular-nums">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-sm px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                      isMe
                        ? 'bg-[#171717] text-white font-medium'
                        : 'bg-white border border-[rgba(23,23,23,0.12)] text-[#171717]'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 border-t border-[rgba(23,23,23,0.08)] bg-white flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(undefined, prompt)}
              className="shrink-0 rounded-sm border border-[rgba(23,23,23,0.15)] bg-[#FAF8F5] px-2.5 py-1 text-[#5F5B55] hover:border-[#171717] hover:text-[#171717] transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {error && (
          <div className="mx-4 mb-2 rounded-sm border border-[#D6536D]/30 bg-[#D6536D]/10 px-3 py-1.5 text-[11px] text-[#D6536D] font-mono">
            {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSend} className="border-t border-[rgba(23,23,23,0.12)] p-3 bg-white flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            maxLength={1000}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type secure message as ${senderType === 'SENDER' ? 'Owner' : 'Receiver'}...`}
            className="flex-1 rounded-sm border border-[rgba(23,23,23,0.15)] bg-[#FAF8F5] px-3 py-2 text-xs text-[#171717] placeholder-[#5F5B55] focus:border-[#E43D12] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="inline-flex items-center justify-center rounded-sm bg-[#E43D12] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c9330d] disabled:opacity-40 transition-colors shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
