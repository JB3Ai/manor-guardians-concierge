import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Droplets,
  Lock,
  PawPrint,
  Zap,
} from 'lucide-react';
import { ResilientImage } from './ResilientImage';

interface ClientPortalShowcaseProps {
  onOpenPortal: (initialTab: 'onboarding' | 'live-stay') => void;
}

export function ClientPortalShowcase({ onOpenPortal }: ClientPortalShowcaseProps) {
  return (
    <section
      id="portal-showcase"
      className="no-print bg-[#121212] text-[#FAF9F6] py-16 sm:py-24 border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-white/10">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-medium tracking-[0.14em] uppercase text-[#C5A059] mb-3">
              Inside the Mobile Client Portal
            </p>
            <h2
              className="font-display font-medium text-[#FAF9F6] leading-[1.12] tracking-tight"
              style={{
                fontSize: 'clamp(1.85rem, 3.2vw, 2.85rem)',
                textWrap: 'balance',
              }}
            >
              See How Your Residence, Pets &amp; Final Bill Look on Your Phone
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#FAF9F6]/70 max-w-md leading-relaxed">
            Once vetted and onboarded, every client receives private mobile portal access for timed
            pet photo updates, home checks, and live expense tracking.
          </p>
        </div>

        {/* 3 Mobile Device Screen Examples */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Example Phone 1: Morning Pet Check-In */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[340px] flex-1 bg-[#1A1A1A] border-[3px] border-[#2C2C2E] rounded-[2rem] p-3 shadow-2xl flex flex-col">
              {/* Top Speaker Notch */}
              <div className="flex items-center justify-between px-3 pt-1 pb-2.5 text-[10px] font-mono text-[#FAF9F6]/60">
                <span>08:04</span>
                <span className="w-16 h-3.5 bg-[#0D0D0D] rounded-full border border-white/10" />
                <span>5G</span>
              </div>

              {/* Screen Surface */}
              <div className="flex-1 bg-[#121212] border border-white/10 rounded-[1.35rem] overflow-hidden flex flex-col">
                <div className="px-4 py-3 bg-[#181818] border-b border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-[#C5A059]">PEH-2026-WKL</p>
                    <p className="font-display text-base font-medium text-[#FAF9F6]">
                      Waterkloof Residence
                    </p>
                  </div>
                  <span className="text-[10px] text-[#FAF9F6]/60">Day 04</span>
                </div>

                <div className="aspect-[4/3] w-full bg-[#0E0E0E]">
                  <ResilientImage
                    src="/images/portal_daily_update_pet_1794747603008.jpg"
                    alt="Two Rhodesian Ridgebacks enjoying morning sunshine on a Pretoria East patio"
                    fallbackTitle="Morning Pet Check-In"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#C5A059]">
                        08:00 AM Morning Check-In
                      </span>
                      <span className="font-mono text-[#FAF9F6]/55">23 Dec</span>
                    </div>
                    <p className="text-xs text-[#FAF9F6]/85 leading-relaxed">
                      “Zuri &amp; Rocco finished their 45-minute garden walk and salmon-oil
                      breakfast. Both girls played fetch with them before the morning heat.”
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-white/10 space-y-1.5 text-[11px] text-[#FAF9F6]/80">
                    <div className="flex items-center gap-2">
                      <PawPrint className="w-3.5 h-3.5 text-[#C5A059]" aria-hidden="true" />
                      <span>Dogs Fed &amp; Walked · Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#C5A059]" aria-hidden="true" />
                      <span>Solar Inverter · 98% Charged</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-[#C5A059] tracking-wide uppercase">
              01. Timed Pet &amp; Playtime Dispatches
            </p>
          </div>

          {/* Example Phone 2: Evening Residence, Pool & Storm Check */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[340px] flex-1 bg-[#1A1A1A] border-[3px] border-[#2C2C2E] rounded-[2rem] p-3 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-3 pt-1 pb-2.5 text-[10px] font-mono text-[#FAF9F6]/60">
                <span>17:36</span>
                <span className="w-16 h-3.5 bg-[#0D0D0D] rounded-full border border-white/10" />
                <span>5G</span>
              </div>

              <div className="flex-1 bg-[#121212] border border-white/10 rounded-[1.35rem] overflow-hidden flex flex-col">
                <div className="px-4 py-3 bg-[#181818] border-b border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-[#C5A059]">PEH-2026-FGL</p>
                    <p className="font-display text-base font-medium text-[#FAF9F6]">
                      Faerie Glen Home
                    </p>
                  </div>
                  <span className="text-[10px] text-[#FAF9F6]/60">Day 06</span>
                </div>

                <div className="aspect-[4/3] w-full bg-[#0E0E0E]">
                  <ResilientImage
                    src="/images/service_estate_pet_care_1794747601774.jpg"
                    alt="Golden retriever resting calmly on a clean travertine terrace at dusk"
                    fallbackTitle="Evening Residence Sweep"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#C5A059]">
                        05:30 PM Evening Update
                      </span>
                      <span className="font-mono text-[#FAF9F6]/55">24 Dec</span>
                    </div>
                    <p className="text-xs text-[#FAF9F6]/85 leading-relaxed">
                      “Brief afternoon thunder passed cleanly. Patio cushions stowed, Barnaby
                      settled inside after evening medication, municipal bins rolled in, and beams
                      armed.”
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-white/10 space-y-1.5 text-[11px] text-[#FAF9F6]/80">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-3.5 h-3.5 text-[#C5A059]" aria-hidden="true" />
                      <span>Pool pH 7.4 · Storm Drains Clear</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059]" aria-hidden="true" />
                      <span>Alarm &amp; Perimeter Security Armed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-[#C5A059] tracking-wide uppercase">
              02. Storm, Pool &amp; Security Logs
            </p>
          </div>

          {/* Example Phone 3: Welcome Refresh & Live ZAR Ledger */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[340px] flex-1 bg-[#1A1A1A] border-[3px] border-[#2C2C2E] rounded-[2rem] p-3 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-3 pt-1 pb-2.5 text-[10px] font-mono text-[#FAF9F6]/60">
                <span>10:15</span>
                <span className="w-16 h-3.5 bg-[#0D0D0D] rounded-full border border-white/10" />
                <span>5G</span>
              </div>

              <div className="flex-1 bg-[#121212] border border-white/10 rounded-[1.35rem] overflow-hidden flex flex-col">
                <div className="px-4 py-3 bg-[#181818] border-b border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-[#C5A059]">PEH-2026-SLV</p>
                    <p className="font-display text-base font-medium text-[#FAF9F6]">
                      Silver Lakes Home
                    </p>
                  </div>
                  <span className="text-[10px] text-[#C5A059]">Return Day</span>
                </div>

                <div className="aspect-[16/9] w-full bg-[#0E0E0E]">
                  <ResilientImage
                    src="/images/service_welcome_reset_1794747602927.jpg"
                    alt="Fresh proteas, crystal carafe, and spotless alabaster kitchen counter prepared for return"
                    fallbackTitle="Welcome Home Refresh"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-[#C5A059]">
                      Live Incidentals &amp; Final Bill
                    </p>
                    <div className="space-y-1.5 text-[11px] tabular-nums">
                      <div className="flex justify-between text-[#FAF9F6]/70">
                        <span>50% Deposit Settled</span>
                        <span className="text-[#C5A059]">− R7,500</span>
                      </div>
                      <div className="flex justify-between text-[#FAF9F6]/85">
                        <span>Woolworths Milk, Bread &amp; Flowers</span>
                        <span>+ R245</span>
                      </div>
                      <div className="flex justify-between text-[#FAF9F6]/85">
                        <span>Pool Chlorine (4kg)</span>
                        <span>+ R220</span>
                      </div>
                      <div className="flex justify-between text-[#FAF9F6] font-semibold pt-1.5 border-t border-white/10">
                        <span>Final Balance Due</span>
                        <span className="text-[#C5A059]">R7,965</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenPortal('live-stay')}
                    className="w-full py-2.5 px-3 bg-[#C5A059] hover:bg-[#D4B26E] text-[#121212] text-[11px] font-semibold rounded-sm inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Inspect Live Ledger Demo</span>
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-[#C5A059] tracking-wide uppercase">
              03. Welcome Refresh &amp; Transparent Billing
            </p>
          </div>
        </div>

        {/* Showcase Action Strip to Open the Full Interactive Portal */}
        <div className="mt-12 p-6 sm:p-8 bg-[#1A1A1A] border border-[#C5A059]/35 rounded-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h3 className="font-display text-2xl sm:text-3xl font-medium text-[#FAF9F6]">
              Explore the Interactive Client Portal Demo
            </h3>
            <p className="text-xs sm:text-sm text-[#FAF9F6]/75 mt-1.5 leading-relaxed">
              Test the multi-step Residence &amp; Pet Onboarding intake form, switch between Client
              View and our Family Team Admin View, or inspect the live Paystack settlement ledger.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenPortal('onboarding')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] border border-white/25 hover:border-[#C5A059] bg-[#121212] text-[#FAF9F6] text-xs sm:text-sm font-medium rounded-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <ClipboardList className="w-4 h-4 text-[#C5A059]" aria-hidden="true" />
              <span>Preview Onboarding Intake</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenPortal('live-stay')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] bg-[#C5A059] hover:bg-[#D4B26E] text-[#121212] text-xs sm:text-sm font-semibold rounded-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-4 h-4 stroke-[2]" aria-hidden="true" />
              <span>Open Interactive Client Portal</span>
              <ArrowRight className="w-4 h-4 stroke-[2]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
