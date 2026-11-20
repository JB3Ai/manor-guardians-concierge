import { useState } from 'react';
import { ArrowRight, MessageCircle, Minus, Plus } from 'lucide-react';
import { WHATSAPP_BASE_URL } from '../data/services';

type FaqCategory = 'All' | 'Vetting & Booking' | 'Pet Compatibility' | 'Insurance & Security';

interface FaqItem {
  id: string;
  number: string;
  category: Exclude<FaqCategory, 'All'>;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-vetting-process',
    number: '01',
    category: 'Vetting & Booking',
    question: 'How does your free vetting consultation work before we confirm a booking?',
    answer:
      'Every new client begins with a complimentary Online Video Call or In-Home Meet & Greet in Pretoria East. We walk through your home routines, answer your questions, and conduct a mandatory pet introduction session so you can observe firsthand how comfortably your animals respond to us. No deposit or booking fee is ever requested until after we have met and both sides are completely confident.',
  },
  {
    id: 'faq-pet-compatibility',
    number: '02',
    category: 'Pet Compatibility',
    question:
      'How do you ensure protective, shy, or high-energy dogs are comfortable with your daughters?',
    answer:
      'Pet safety and calm body language come first. During the in-home introduction, we follow your lead on your dogs’ boundaries and favourite rewards. While I manage gate security, leashed street walks, and feeding schedules, our daughters engage only in supervised, gentle garden playtime suited to each dog’s temperament. If a pet prefers quiet company over energetic play, we respect that pace completely.',
  },
  {
    id: 'faq-insurance-liability',
    number: '03',
    category: 'Insurance & Security',
    question: 'What insurance coverage and security safeguards apply while you care for our home?',
    answer:
      'We carry dedicated public liability cover for our concierge and pet-care operations, and we ask every homeowner to confirm with their insurer that an invited, vetted live-in caretaker is noted under their existing buildings and contents policy (a standard free endorsement with most South African insurers). Before handover, we also provide SA ID copies for estate/boomed-area clearance, register our emergency contacts, and follow your exact armed-response password and alarm zone protocols.',
  },
  {
    id: 'faq-medication-storms',
    number: '04',
    category: 'Pet Compatibility',
    question:
      'Can you handle senior dogs on daily medication or pets anxious during Pretoria thunderstorms?',
    answer:
      'Yes. In your Digital Residence Dossier, you log exact dosage times, dietary allergies, and your Pretoria veterinarian’s direct number. Because we stay on-site (24/7 tier) rather than rushing in for a 15-minute drop-in, we monitor afternoon Highveld storms, close curtains early, keep noise-sensitive pets calm indoors, and verify solar inverters and DB trips after lightning.',
  },
  {
    id: 'faq-at-home-support',
    number: '05',
    category: 'Vetting & Booking',
    question: 'Do we have to be away on holiday to book Pretoria East Home & Pet Concierge?',
    answer:
      'Not at all. Many local families book us while they are right at home, especially in December, to offload municipal bin days, pool upkeep, window washing, airport pickups, trusted school/activity runs, supervised family helpers, or guided day trips for visiting relatives and children.',
  },
  {
    id: 'faq-payment-deposit',
    number: '06',
    category: 'Vetting & Booking',
    question: 'When are the 50% booking deposit and out-of-pocket incidentals settled?',
    answer:
      'Only after your free consultation is approved do we issue a formal invoice for the 50% deposit to lock your calendar dates. The remaining 50% stay balance, plus any pre-approved, receipted incidentals like pool chlorine or your Woolworths Welcome Home groceries, is itemized transparently in your Client Portal ledger and settled at the end of your stay.',
  },
  {
    id: 'faq-vehicle-chauffeur',
    number: '07',
    category: 'Insurance & Security',
    question: 'Is private chauffeur transport & airport transfer coverage insured and reliable?',
    answer:
      'Yes. Every OR Tambo, Lanseria, school-run, or curated day-trip transfer is driven personally by our vetted family team, never outsourced to unknown ride-share drivers. We track flight arrivals in real time, confirm every pickup via WhatsApp, and maintain full passenger and vehicle cover.',
  },
  {
    id: 'faq-boundary-coverage',
    number: '08',
    category: 'Vetting & Booking',
    question: 'What if our residence sits just outside the red Pretoria East map boundary?',
    answer:
      'Our zero-surcharge core zone covers Waterkloof, Menlo Park, Lynnwood, Faerie Glen, Garsfontein, Silver Lakes, Moreleta Park, Mooikloof, Erasmuskloof, and Monument Park. If your home is in a neighbouring Pretoria suburb such as Irene, Woodhill, or Brooklyn, select “Outside Boundary” in your consultation request and we will provide a straightforward custom travel rate.',
  },
];

const CATEGORIES: FaqCategory[] = [
  'All',
  'Vetting & Booking',
  'Pet Compatibility',
  'Insurance & Security',
];

interface FaqSectionProps {
  onRequestConsultation: () => void;
}

export function FaqSection({ onRequestConsultation }: FaqSectionProps) {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('All');
  const [openIds, setOpenIds] = useState<string[]>([FAQ_ITEMS[0].id, FAQ_ITEMS[2].id]);

  const filteredItems =
    activeCategory === 'All'
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === activeCategory);

  const toggleItem = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section
      id="faq"
      className="no-print bg-[#FAF9F6] text-[#121212] py-16 sm:py-24 border-b border-[#121212]/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Sticky Editorial Column */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div>
              <p className="text-xs sm:text-sm font-medium tracking-[0.14em] uppercase text-[#8A6A2B] mb-3">
                Frequently Asked Questions
              </p>
              <h2
                className="font-display font-medium text-[#121212] leading-[1.12] tracking-tight mb-4"
                style={{
                  fontSize: 'clamp(1.85rem, 3.2vw, 2.75rem)',
                  textWrap: 'balance',
                }}
              >
                Vetting, Pet Compatibility &amp; Insurance Clarity
              </h2>
              <p className="text-sm text-[#121212]/70 leading-relaxed">
                Straightforward answers on how we protect your home, introduce ourselves to your
                animals, and structure coverage across Pretoria East.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div
              role="tablist"
              aria-label="Filter FAQ topics"
              className="flex flex-wrap gap-2"
            >
              {CATEGORIES.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveCategory(category)}
                    className={`px-3.5 py-2 min-h-[38px] text-xs font-medium rounded-sm border transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#121212] text-[#FAF9F6] border-[#121212]'
                        : 'bg-white text-[#121212]/75 border-[#121212]/15 hover:border-[#C5A059]'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Direct Concierge Callout */}
            <div className="p-6 bg-[#121212] text-[#FAF9F6] rounded-sm border border-[#C5A059]/35 space-y-4">
              <p className="font-display text-2xl font-medium text-[#FAF9F6]">
                Prefer to ask us directly?
              </p>
              <p className="text-xs sm:text-sm text-[#FAF9F6]/75 leading-relaxed">
                Schedule your free online or in-home meet-and-greet, or message us directly on
                WhatsApp about specific pets, alarm systems, or December dates.
              </p>
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onRequestConsultation}
                  className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] bg-[#C5A059] hover:bg-[#D4B26E] text-[#121212] text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-sm transition-colors cursor-pointer"
                >
                  <span>Request Free Consultation</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <a
                  href={WHATSAPP_BASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full min-h-[42px] border border-white/25 hover:border-[#C5A059] text-[#FAF9F6] text-xs sm:text-sm font-medium px-4 py-2 rounded-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#C5A059]" aria-hidden="true" />
                  <span>Ask via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Gold-Accented Accordion List */}
          <div className="lg:col-span-8 space-y-3.5">
            {filteredItems.map((item) => {
              const isOpen = openIds.includes(item.id);
              const panelId = `${item.id}-panel`;
              const buttonId = `${item.id}-button`;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-sm border transition-colors duration-200 ${
                    isOpen
                      ? 'border-[#C5A059] shadow-sm'
                      : 'border-[#121212]/12 hover:border-[#C5A059]/60'
                  }`}
                >
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggleItem(item.id)}
                      className="w-full px-5 sm:px-7 py-5 text-left flex items-start justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] rounded-sm"
                    >
                      <div className="flex items-start gap-3.5 sm:gap-5">
                        <span
                          className={`font-mono text-xs pt-1 tabular-nums shrink-0 ${
                            isOpen ? 'text-[#8A6A2B] font-semibold' : 'text-[#121212]/45'
                          }`}
                        >
                          {item.number}
                        </span>
                        <div>
                          <span className="block text-[11px] font-medium tracking-wider uppercase text-[#8A6A2B] mb-1">
                            {item.category}
                          </span>
                          <span className="font-display text-xl sm:text-2xl font-medium text-[#121212] leading-snug block">
                            {item.question}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`w-9 h-9 mt-1 inline-flex items-center justify-center rounded-sm border shrink-0 transition-colors ${
                          isOpen
                            ? 'bg-[#C5A059] border-[#C5A059] text-[#121212]'
                            : 'bg-[#FAF9F6] border-[#121212]/15 text-[#121212]/70'
                        }`}
                        aria-hidden="true"
                      >
                        {isOpen ? (
                          <Minus className="w-4 h-4 stroke-[2]" />
                        ) : (
                          <Plus className="w-4 h-4 stroke-[2]" />
                        )}
                      </span>
                    </button>
                  </h3>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="px-5 sm:px-7 pb-6 pt-0 sm:pl-[4.25rem]"
                    >
                      <div className="pt-3 border-t border-[#C5A059]/30 text-sm sm:text-base text-[#121212]/80 leading-relaxed">
                        {item.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
