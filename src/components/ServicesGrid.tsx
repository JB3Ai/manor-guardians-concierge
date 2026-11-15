import {
  ArrowUpRight,
  CalendarClock,
  Car,
  Check,
  Home,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { BESPOKE_SERVICES } from '../data/services';
import { BespokeService } from '../types/concierge';
import { ResilientImage } from './ResilientImage';

interface ServicesGridProps {
  onSelectServiceAction: (service: BespokeService) => void;
}

function getServiceIcon(id: BespokeService['id']) {
  switch (id) {
    case 'core-residence-pet-care':
      return Home;
    case 'welcome-home-refresh':
      return Sparkles;
    case 'trusted-chauffeur-day-trips':
      return Car;
    case 'vetted-family-staff-specialist':
      return Users;
    case 'peak-festive-surcharge':
      return CalendarClock;
    case 'pre-arrival-maintenance':
      return Wrench;
    default:
      return ShieldCheck;
  }
}

export function ServicesGrid({ onSelectServiceAction }: ServicesGridProps) {
  const featuredServices = BESPOKE_SERVICES.slice(0, 2);
  const secondaryServices = BESPOKE_SERVICES.slice(2);

  return (
    <section
      id="services"
      className="no-print bg-[#FAF9F6] text-[#121212] py-16 sm:py-24 border-b border-[#121212]/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-[#121212]/10">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-medium tracking-[0.14em] uppercase text-[#8A6A2B] mb-3">
              Bespoke Services &amp; Transparent Tariff
            </p>
            <h2
              className="font-display font-medium text-[#121212] leading-[1.12] tracking-tight"
              style={{
                fontSize: 'clamp(1.85rem, 3.2vw, 2.85rem)',
                textWrap: 'balance',
              }}
            >
              Residence Care, Pet Companionship, Chauffeur Trips &amp; Vetted Home Staff
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#121212]/70 max-w-md leading-relaxed">
            Available whether you are traveling or staying home to enjoy December without the
            household errands, hosting prep, or driving load.
          </p>
        </div>

        {/* Top Marquee Pair: Core Residence & Pet Care + Welcome Home Refresh */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-10">
          {featuredServices.map((service, idx) => {
            const Icon = getServiceIcon(service.id);
            const colSpan = idx === 0 ? 'lg:col-span-7' : 'lg:col-span-5';

            return (
              <article
                key={service.id}
                className={`${colSpan} bg-white border border-[#121212]/10 rounded-sm overflow-hidden flex flex-col`}
              >
                {service.featuredImage && (
                  <div className="aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden bg-[#1A1A1A]">
                    <ResilientImage
                      src={service.featuredImage}
                      alt={service.featuredImageAlt || service.title}
                      fallbackTitle={service.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                    />
                  </div>
                )}

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6">
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2.5 text-xs font-medium tracking-wider uppercase text-[#8A6A2B]">
                        <Icon className="w-4 h-4 stroke-[1.75]" aria-hidden="true" />
                        <span>
                          {service.indexNumber}. {service.categoryLabel}
                        </span>
                      </div>
                      <div className="text-right tabular-nums">
                        <span className="font-display text-2xl sm:text-3xl font-semibold text-[#121212]">
                          {service.priceLabel}
                        </span>
                        <span className="block text-[11px] text-[#121212]/60">
                          {service.billingUnit}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-display text-2xl sm:text-3xl font-medium text-[#121212] mb-3">
                      {service.title}
                    </h3>

                    <p className="text-sm sm:text-base text-[#121212]/75 leading-relaxed mb-5">
                      {service.summary}
                    </p>

                    <ul className="space-y-2.5 text-sm text-[#121212]/80">
                      {service.highlights.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <Check
                            className="w-4 h-4 text-[#A6833E] mt-0.5 shrink-0 stroke-[2]"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-[#121212]/10 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onSelectServiceAction(service)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#121212] hover:text-[#A6833E] transition-colors cursor-pointer py-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] rounded-sm"
                    >
                      <span>{service.actionLabel}</span>
                      <ArrowUpRight className="w-4 h-4 stroke-[2]" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Lower 4-Column Architectural Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 lg:mt-8">
          {secondaryServices.map((service) => {
            const Icon = getServiceIcon(service.id);
            return (
              <article
                key={service.id}
                className="bg-white border border-[#121212]/10 rounded-sm p-6 flex flex-col justify-between gap-6"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="text-[11px] font-medium tracking-wider uppercase text-[#8A6A2B]">
                      {service.indexNumber} · {service.categoryLabel}
                    </span>
                    <Icon className="w-4 h-4 text-[#A6833E] stroke-[1.75] shrink-0" aria-hidden="true" />
                  </div>

                  <h3 className="font-display text-xl sm:text-2xl font-medium text-[#121212] leading-snug mb-2">
                    {service.title}
                  </h3>

                  <div className="mb-4 pb-4 border-b border-[#121212]/10 tabular-nums">
                    <span className="font-display text-2xl font-semibold text-[#121212]">
                      {service.priceLabel}
                    </span>
                    <span className="block text-xs text-[#121212]/65 mt-0.5">
                      {service.billingUnit}
                    </span>
                  </div>

                  <p className="text-sm text-[#121212]/75 leading-relaxed mb-4">
                    {service.summary}
                  </p>

                  <ul className="space-y-2 text-xs sm:text-sm text-[#121212]/80">
                    {service.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-[#A6833E] font-semibold" aria-hidden="true">
                          ·
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-[#121212]/10">
                  <button
                    type="button"
                    onClick={() => onSelectServiceAction(service)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#121212] hover:text-[#A6833E] transition-colors cursor-pointer py-1 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] rounded-sm"
                  >
                    <span>{service.actionLabel}</span>
                    <ArrowUpRight className="w-4 h-4 stroke-[1.75]" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
