import { ArrowRight, MessageCircle } from 'lucide-react';
import { WHATSAPP_BASE_URL } from '../data/services';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  onCalculateQuote: () => void;
}

export function HeroSection({ onCalculateQuote }: HeroSectionProps) {
  return (
    <section
      id="top"
      className="no-print relative bg-[#121212] text-[#FAF9F6] overflow-hidden border-b border-white/10"
    >
      {/* Full-bleed Architectural Backdrop with Measured Scrim */}
      <div className="absolute inset-0">
        <ResilientImage
          src="/images/hero_pretoria_estate_1794747601161.jpg"
          alt="Luxury contemporary Pretoria East residence illuminated at twilight beside an infinity pool"
          loading="eager"
          fallbackTitle="Pretoria East Home & Pet Concierge"
          className="w-full h-full object-cover object-center opacity-70"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/80 to-[#121212]/40"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-[#121212]/60"
          aria-hidden="true"
        />
      </div>

      {/* Hero Foreground Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14 sm:pt-24 sm:pb-20 lg:pt-32 lg:pb-24">
        <div className="max-w-3xl">
          <p className="text-xs sm:text-sm font-medium tracking-[0.14em] uppercase text-[#C5A059] mb-5">
            Pretoria East · Residence Management, Pet Care &amp; Family Concierge
          </p>

          <h1
            className="font-display font-medium text-[#FAF9F6] leading-[1.08] tracking-tight mb-6"
            style={{
              fontSize: 'clamp(2.35rem, 4.5vw, 4.15rem)',
              textWrap: 'balance',
            }}
          >
            Your Residence, Impeccably Cared For at Home or Away
          </h1>

          <p className="text-base sm:text-lg text-[#FAF9F6]/85 leading-relaxed max-w-2xl mb-9">
            Trusted local family support in Pretoria East. Travel with 24/7 live-in home and pet
            guardianship plus daily WhatsApp photo updates, or stay home and let us handle December
            chores, errands, chauffeur drives, and hosting prep. Every booking starts with a free
            vetting consultation and pet introduction.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              type="button"
              onClick={onCalculateQuote}
              className="inline-flex items-center justify-center gap-2.5 bg-[#C5A059] hover:bg-[#D4B26E] text-[#121212] font-semibold text-sm sm:text-base px-6 py-3.5 min-h-[48px] rounded-sm transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF9F6]"
            >
              <span>Calculate Quote &amp; Free Consult</span>
              <ArrowRight className="w-4 h-4 stroke-[2]" aria-hidden="true" />
            </button>

            <a
              href={WHATSAPP_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 border border-[#FAF9F6]/35 hover:border-[#C5A059] bg-[#121212]/60 hover:bg-[#121212]/90 text-[#FAF9F6] font-medium text-sm sm:text-base px-6 py-3.5 min-h-[48px] rounded-sm transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
            >
              <MessageCircle className="w-4 h-4 text-[#C5A059] stroke-[1.75]" aria-hidden="true" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Unboxed Regional & Service Metadata Strip */}
        <div className="mt-14 sm:mt-20 pt-6 border-t border-white/15 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-[#FAF9F6]/75">
          <span>Waterkloof · Lynnwood · Faerie Glen · Silver Lakes · Mooikloof</span>
          <span aria-hidden="true" className="text-[#C5A059]">
            ·
          </span>
          <span>Away or At-Home Support</span>
          <span aria-hidden="true" className="text-[#C5A059]">
            ·
          </span>
          <span>Free Meet &amp; Greet + Pet Introduction</span>
          <span aria-hidden="true" className="text-[#C5A059]">
            ·
          </span>
          <span>December Festive Availability</span>
        </div>
      </div>
    </section>
  );
}
