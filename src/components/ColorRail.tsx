import React from 'react';

export const ColorRail: React.FC = () => {
  return (
    <>
      {/* Desktop Vertical Right Color Rail */}
      <aside
        aria-hidden="true"
        className="fixed right-0 top-0 bottom-0 z-30 hidden lg:flex flex-col w-12 border-l border-[rgba(23,23,23,0.1)] select-none pointer-events-none"
      >
        <div className="flex-1 bg-[#E43D12] relative group flex items-center justify-center">
          <span className="transform -rotate-90 text-[9px] font-mono tracking-widest text-white/90 whitespace-nowrap uppercase">
            AES-256
          </span>
        </div>
        <div className="flex-1 bg-[#D6536D] relative flex items-center justify-center">
          <span className="transform -rotate-90 text-[9px] font-mono tracking-widest text-white/90 whitespace-nowrap uppercase">
            ZERO-TRUST
          </span>
        </div>
        <div className="flex-1 bg-[#FFA2B6] relative flex items-center justify-center">
          <span className="transform -rotate-90 text-[9px] font-mono tracking-widest text-[#171717]/80 whitespace-nowrap uppercase font-semibold">
            EPHEMERAL
          </span>
        </div>
        <div className="flex-1 bg-[#EFB11D] relative flex items-center justify-center">
          <span className="transform -rotate-90 text-[9px] font-mono tracking-widest text-[#171717]/90 whitespace-nowrap uppercase font-semibold">
            ATOMIC
          </span>
        </div>
        <div className="flex-1 bg-[#EBE9E1] border-t border-[rgba(23,23,23,0.08)] relative flex items-center justify-center">
          <span className="transform -rotate-90 text-[9px] font-mono tracking-widest text-[#5F5B55] whitespace-nowrap uppercase">
            AUDITED
          </span>
        </div>
      </aside>

      {/* Mobile Horizontal Color Strip */}
      <div className="lg:hidden flex h-1.5 w-full select-none" aria-hidden="true">
        <div className="flex-1 bg-[#E43D12]" />
        <div className="flex-1 bg-[#D6536D]" />
        <div className="flex-1 bg-[#FFA2B6]" />
        <div className="flex-1 bg-[#EFB11D]" />
        <div className="flex-1 bg-[#EBE9E1] border-b border-[rgba(23,23,23,0.12)]" />
      </div>
    </>
  );
};
