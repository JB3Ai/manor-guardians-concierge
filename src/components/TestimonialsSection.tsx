import { useState } from 'react';
import { ArrowRight, Quote } from 'lucide-react';

type TestimonialCategory = 'All' | 'Travel & Live-In Care' | 'At-Home Support & Day Trips' | 'Pet & Home Oversight';

interface ClientTestimonial {
  id: string;
  category: Exclude<TestimonialCategory, 'All'>;
  quote: string;
  author: string;
  suburb: string;
  engagementSummary: string;
  outcomeMetric: string;
}

const PRETORIA_EAST_TESTIMONIALS: ClientTestimonial[] = [
  {
    id: 'test-waterkloof',
    category: 'Travel & Live-In Care',
    quote:
      'The free in-home meet-and-greet put us at ease immediately, watching the girls gently introduce themselves to both our Ridgebacks meant we actually switched off in Cape Town. Coming home to fresh proteas, crisp linens, and milk and sourdough in the fridge was effortless.',
    author: 'Dr. Pieter & Nadia Cronjé',
    suburb: 'Waterkloof',
    engagementSummary: '14-Day December Care · 2 Rhodesian Ridgebacks',
    outcomeMetric: '28 timed photo updates delivered on schedule',
  },
  {
    id: 'test-silver-lakes',
    category: 'At-Home Support & Day Trips',
    quote:
      'We weren’t even traveling over Christmas. We stayed home hosting overseas family and used the concierge for OR Tambo transfers, an Irene Dairy Farm & Acrobranch kids’ outing, extra supervised helpers, and bin/pool upkeep. Worth every Rand.',
    author: 'Claire & Stefan van Rooyen',
    suburb: 'Silver Lakes',
    engagementSummary: 'At-Home December Support · Family Outings & Chauffeur',
    outcomeMetric: '6 airport & family trips completed with zero delays',
  },
  {
    id: 'test-faerie-glen',
    category: 'Pet & Home Oversight',
    quote:
      'Our senior Labrador takes twice-daily joint medication and panics during Highveld thunder. Having a dad-and-daughters team stay in our home meant Dad handled the tripped inverter breaker after a storm while the girls kept our boy calm inside.',
    author: 'Marelize Du Plessis',
    suburb: 'Faerie Glen',
    engagementSummary: '9-Day Residence Care · Senior Labrador & Koi Pond',
    outcomeMetric: '100% medication & storm-check compliance',
  },
  {
    id: 'test-lynnwood',
    category: 'Travel & Live-In Care',
    quote:
      'We used to dread returning from Europe to green pools, wilted patio herbs, and frantic vet drop-offs. Now we get morning and evening WhatsApp photos, our windows and paving are spotless, and our cats barely notice we left.',
    author: 'Henk & Marike Vermaak',
    suburb: 'Lynnwood',
    engagementSummary: '11-Day International Travel · 2 Burmese Cats + Power Wash',
    outcomeMetric: 'Full Welcome Home Refresh completed 3h pre-landing',
  },
  {
    id: 'test-moreleta',
    category: 'At-Home Support & Day Trips',
    quote:
      'Having someone we personally vetted and trust to handle school-holiday activity runs, pick-up laundry, and a supervised Cullinan Diamond Mine day trip for our visiting nieces took all the pressure off our work-from-home week.',
    author: 'Thandi & Kabelo Ndlovu',
    suburb: 'Moreleta Park',
    engagementSummary: '5-Day Family Support · Day Trips & Laundry Concierge',
    outcomeMetric: '12+ hours of errands & driving offloaded',
  },
  {
    id: 'test-mooikloof',
    category: 'Pet & Home Oversight',
    quote:
      'After an unsettling experience with a commercial pet-sitting agency, meeting this local Pretoria East family in our garden before committing changed everything. Every gate check, pool backwash, and Woolworths top-up receipt was transparent.',
    author: 'Grant & Belinda Meyer',
    suburb: 'Mooikloof',
    engagementSummary: '10-Day Festive Stay · 3 Dogs & Security Oversight',
    outcomeMetric: 'Itemized ZAR ledger reconciled same day on return',
  },
];

const CATEGORIES: TestimonialCategory[] = [
  'All',
  'Travel & Live-In Care',
  'At-Home Support & Day Trips',
  'Pet & Home Oversight',
];

interface TestimonialsSectionProps {
  onRequestConsultation: () => void;
}

export function TestimonialsSection({ onRequestConsultation }: TestimonialsSectionProps) {
  const [activeCategory, setActiveCategory] = useState<TestimonialCategory>('All');

  const visibleTestimonials =
    activeCategory === 'All'
      ? PRETORIA_EAST_TESTIMONIALS
      : PRETORIA_EAST_TESTIMONIALS.filter((t) => t.category === activeCategory);

  return (
    <section
      id="testimonials"
      className="no-print bg-[#121212] text-[#FAF9F6] py-16 sm:py-24 border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header + Interactive Category Filter */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-white/10">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-medium tracking-[0.14em] uppercase text-[#C5A059] mb-3">
              Client Testimonials
            </p>
            <h2
              className="font-display font-medium text-[#FAF9F6] leading-[1.12] tracking-tight"
              style={{
                fontSize: 'clamp(1.85rem, 3.2vw, 2.85rem)',
                textWrap: 'balance',
              }}
            >
              Trusted by Pretoria East Families Across Every Season
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Filter client testimonials"
            className="flex flex-wrap items-center gap-2"
          >
            {CATEGORIES.map((category) => {
              const isSelected = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveCategory(category)}
                  className={`px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-sm border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#C5A059] text-[#121212] border-[#C5A059] font-semibold'
                      : 'bg-[#1A1A1A] text-[#FAF9F6]/75 border-white/15 hover:border-[#C5A059]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {visibleTestimonials.map((item) => (
            <article
              key={item.id}
              className="bg-[#1A1A1A] border border-white/10 rounded-sm p-6 sm:p-8 flex flex-col justify-between gap-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium tracking-wider uppercase text-[#C5A059]">
                    {item.suburb}
                  </span>
                  <Quote
                    className="w-4 h-4 text-[#C5A059]/70 stroke-[1.5]"
                    aria-hidden="true"
                  />
                </div>

                <blockquote className="font-display text-xl sm:text-[22px] italic text-[#FAF9F6]/95 leading-snug">
                  “{item.quote}”
                </blockquote>
              </div>

              <footer className="pt-5 border-t border-white/10 space-y-1.5">
                <p className="text-sm font-semibold text-[#FAF9F6]">{item.author}</p>
                <p className="text-xs text-[#FAF9F6]/65">{item.engagementSummary}</p>
                <p className="text-xs text-[#C5A059] font-medium pt-0.5">
                  {item.outcomeMetric}
                </p>
              </footer>
            </article>
          ))}
        </div>

        {/* Bottom CTA Strip */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-[#FAF9F6]/75">
            Direct Pretoria East homeowner references are gladly shared during your free
            meet-and-greet consultation.
          </p>
          <button
            type="button"
            onClick={onRequestConsultation}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] bg-[#C5A059] hover:bg-[#D4B26E] text-[#121212] text-xs sm:text-sm font-semibold rounded-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Book Your Free Meet &amp; Greet</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
