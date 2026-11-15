import { useState } from 'react';
import { Lock, Menu, MessageCircle, X } from 'lucide-react';
import { BRAND_NAME, WHATSAPP_BASE_URL } from '../data/services';

interface NavbarProps {
  activeView: 'landing' | 'portal';
  onNavigateSection: (sectionId: string) => void;
  onOpenClientPortal: () => void;
}

const NAV_LINKS = [
  { label: 'Services', targetId: 'services' },
  { label: 'Who We Are', targetId: 'who-we-are' },
  { label: 'Testimonials', targetId: 'testimonials' },
  { label: 'Quote & Consult', targetId: 'quote' },
];

export function Navbar({
  activeView,
  onNavigateSection,
  onOpenClientPortal,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (targetId: string) => {
    setMobileMenuOpen(false);
    onNavigateSection(targetId);
  };

  const handlePortalClick = () => {
    setMobileMenuOpen(false);
    onOpenClientPortal();
  };

  return (
    <header className="no-print sticky top-0 z-50 bg-[#121212]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('top');
          }}
          className="font-display text-lg sm:text-xl font-medium tracking-tight text-[#FAF9F6] whitespace-nowrap shrink-0 truncate max-w-[205px] sm:max-w-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] rounded-sm"
        >
          {BRAND_NAME}
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Primary navigation" className="hidden xl:flex items-center gap-6">
          {NAV_LINKS.map((item) => (
            <a
              key={item.targetId}
              href={`#${item.targetId}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(item.targetId);
              }}
              className="text-sm font-medium text-[#FAF9F6]/80 hover:text-[#C5A059] transition-colors duration-200 underline-offset-8 hover:underline whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] rounded-sm py-1"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Client Portal Button + WhatsApp Concierge Button + Mobile Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePortalClick}
            className={`hidden sm:inline-flex items-center gap-2 font-medium text-xs sm:text-sm px-3.5 py-2.5 rounded-sm border transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] ${
              activeView === 'portal'
                ? 'bg-[#FAF9F6] text-[#121212] border-[#FAF9F6] font-semibold'
                : 'bg-[#1A1A1A] hover:border-[#C5A059] text-[#FAF9F6] border-[#C5A059]/50'
            }`}
          >
            <Lock
              className={`w-3.5 h-3.5 stroke-[2] ${
                activeView === 'portal' ? 'text-[#121212]' : 'text-[#C5A059]'
              }`}
              aria-hidden="true"
            />
            <span>Client Portal</span>
          </button>

          <a
            href={WHATSAPP_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 bg-[#C5A059] hover:bg-[#D4B26E] text-[#121212] font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-sm transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF9F6]"
          >
            <MessageCircle className="w-4 h-4 stroke-[2]" aria-hidden="true" />
            <span>WhatsApp Concierge</span>
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="xl:hidden inline-flex items-center justify-center w-11 h-11 text-[#FAF9F6] hover:text-[#C5A059] border border-white/15 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#121212] border-t border-white/10 px-4 py-5 space-y-2">
          {NAV_LINKS.map((item) => (
            <a
              key={item.targetId}
              href={`#${item.targetId}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(item.targetId);
              }}
              className="flex items-center min-h-[44px] px-2 text-base font-medium text-[#FAF9F6]/90 hover:text-[#C5A059] border-b border-white/5 transition-colors"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handlePortalClick}
              className="flex items-center justify-center gap-2 w-full min-h-[46px] bg-[#1A1A1A] border border-[#C5A059]/60 hover:border-[#C5A059] text-[#FAF9F6] font-semibold text-sm px-4 py-3 rounded-sm transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#C5A059] stroke-[2]" aria-hidden="true" />
              <span>Client Portal</span>
            </button>

            <a
              href={WHATSAPP_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full min-h-[46px] bg-[#C5A059] hover:bg-[#D4B26E] text-[#121212] font-semibold text-sm px-4 py-3 rounded-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4 stroke-[2]" aria-hidden="true" />
              <span>WhatsApp Concierge</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
