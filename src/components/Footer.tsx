import { MessageCircle } from 'lucide-react';
import { BRAND_NAME, PRETORIA_SUBURBS, WHATSAPP_BASE_URL } from '../data/services';

interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
}

export function Footer({ onNavigateSection }: FooterProps) {
  return (
    <footer className="no-print bg-[#0D0D0D] text-[#FAF9F6] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
          <div className="md:col-span-5 space-y-3">
            <span className="font-display text-2xl font-medium text-[#FAF9F6] block">
              {BRAND_NAME}
            </span>
            <p className="text-sm text-[#FAF9F6]/65 max-w-sm leading-relaxed">
              Trusted Pretoria East family offering 24/7 live-in residence care, pet companionship,
              chauffeur &amp; curated day trips, and Welcome Home refreshes—whether you are away or
              at home.
            </p>
          </div>

          <div className="md:col-span-4 space-y-2">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#C5A059] mb-3">
              Pretoria East Suburbs Covered
            </p>
            <p className="text-xs sm:text-sm text-[#FAF9F6]/70 leading-relaxed">
              {PRETORIA_SUBURBS.join(' · ')}
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#C5A059]">
              Direct Concierge
            </p>
            <nav aria-label="Footer navigation" className="flex flex-col gap-2 text-sm">
              <button
                type="button"
                onClick={() => onNavigateSection('services')}
                className="text-left text-[#FAF9F6]/75 hover:text-[#C5A059] transition-colors cursor-pointer"
              >
                Services &amp; ZAR Tariff
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('who-we-are')}
                className="text-left text-[#FAF9F6]/75 hover:text-[#C5A059] transition-colors cursor-pointer"
              >
                Who We Are &amp; Coverage
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('quote')}
                className="text-left text-[#FAF9F6]/75 hover:text-[#C5A059] transition-colors cursor-pointer"
              >
                Quote &amp; Free Consultation
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('portal')}
                className="text-left text-[#FAF9F6]/75 hover:text-[#C5A059] transition-colors cursor-pointer"
              >
                Client Portal
              </button>
              <a
                href={WHATSAPP_BASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#C5A059] hover:text-[#D4B26E] pt-1 font-medium"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>WhatsApp Concierge</span>
              </a>
            </nav>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#FAF9F6]/50">
          <span>
            © {new Date().getFullYear()} {BRAND_NAME}. Pretoria East, South Africa.
          </span>
          <span>All tariffs quoted in South African Rand (ZAR).</span>
        </div>
      </div>
    </footer>
  );
}
