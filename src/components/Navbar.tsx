import React from 'react';
import { Lock, FileUp, User, LogOut, CheckCircle2 } from 'lucide-react';
import { UserAccount } from '../types';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenUpload: () => void;
  user: UserAccount | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeShareSlug?: string;
  onOpenReceiverDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenUpload,
  user,
  onOpenAuth,
  onLogout,
  onOpenReceiverDemo
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'files', label: 'Files' },
    { id: 'shares', label: 'Shares' },
    { id: 'security', label: 'Security' },
    { id: 'activity', label: 'Activity' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[rgba(23,23,23,0.12)] bg-[#EBE9E1]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 lg:pr-16">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onTabChange('landing')}
            className="flex items-center gap-2 text-left focus:outline-none group"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#E43D12] text-white font-mono font-bold text-xs shadow-sm">
              VX
            </div>
            <span className="text-xl font-display font-extrabold tracking-tight text-[#171717]">
              VAULT<span className="text-[#E43D12]">X</span>
            </span>
          </button>
          <span className="hidden sm:inline-block text-[10px] font-mono tracking-widest text-[#5F5B55] uppercase border-l border-[rgba(23,23,23,0.15)] pl-3">
            ZERO-TRUST ARCHITECTURE
          </span>
        </div>

        {/* Minimal Editorial Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-[#5F5B55]">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative py-1 transition-colors hover:text-[#171717] ${
                  isActive ? 'text-[#171717]' : ''
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E43D12]" />
                )}
              </button>
            );
          })}
          <button
            onClick={onOpenReceiverDemo}
            className={`flex items-center gap-1.5 py-1 transition-colors hover:text-[#E43D12] ${
              currentTab === 'receiver' ? 'text-[#E43D12]' : 'text-[#5F5B55]'
            }`}
          >
            <Lock className="h-3 w-3 text-[#E43D12]" />
            <span>Receiver Portal</span>
          </button>
        </nav>

        {/* Primary Action Button & User */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 rounded-sm bg-[#E43D12] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#c9330d] active:scale-[0.98] border border-[#E43D12]"
          >
            <FileUp className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">Upload & Share</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2.5 pl-3 border-l border-[rgba(23,23,23,0.12)]">
              <div className="flex items-center gap-1.5 text-xs text-[#171717]">
                <span className="font-semibold">{user.name.split(' ')[0]}</span>
                {user.verified ? (
                  <span title="Verified Account">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#34A853]" />
                  </span>
                ) : (
                  <span className="text-[#EFB11D] text-[10px] font-mono">(unverified)</span>
                )}
              </div>
              <button
                onClick={onLogout}
                className="p-1 text-[#5F5B55] hover:text-[#E43D12] transition-colors"
                title="Log Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 rounded-sm border border-[rgba(23,23,23,0.2)] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#171717] transition-colors hover:border-[#171717]"
            >
              <User className="h-3.5 w-3.5 text-[#5F5B55]" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
