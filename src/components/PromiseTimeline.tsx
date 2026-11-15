import { Camera, ClipboardCheck, FileSignature } from 'lucide-react';

const TIMELINE_STEPS = [
  {
    step: '01',
    title: 'Instant Quote & Deposit',
    subtitle: 'Transparent ZAR itemisation · 50% date lock',
    description:
      'Enter your Pretoria travel window, pet routines, and optional transfers in our quote engine. Peak festive nights (Dec 20 – Jan 2) are calculated automatically, and a 50% deposit secures your assigned Senior Guardian.',
    icon: FileSignature,
  },
  {
    step: '02',
    title: 'Digital Onboarding',
    subtitle: 'Pre-departure residence & veterinary dossier',
    description:
      'Before departure, you complete one structured digital handover covering estate biometric registration, alarm zones, borehole/solar inverter notes, feeding gram-weights, and your Pretoria veterinarian’s direct contact.',
    icon: ClipboardCheck,
  },
  {
    step: '03',
    title: 'Daily Timed Photo Updates & Welcome Reset',
    subtitle: '08:00 & 18:00 WhatsApp dispatches · Arrival refresh',
    description:
      'While away, receive punctual morning and evening photo updates verifying pet vitality, pool clarity, and perimeter security. Hours before your return flight, our team completes your Welcome Home Reset.',
    icon: Camera,
  },
];

const CLIENT_REFERENCES = [
  {
    quote:
      'Knowing Hendrik was living on-site in Waterkloof Ridge through the December storms meant we actually switched off in Cape Town. The 08:00 and 18:00 photos of both Ridgebacks and coming home to fresh linens and a stocked fridge was effortless.',
    author: 'Dr. Pieter & Nadia Cronjé',
    estate: 'Waterkloof Ridge · 14-day Festive Guardianship',
  },
  {
    quote:
      'Their chauffeur met our delayed British Airways flight at OR Tambo while the garden, koi pond, and three cats were spotless. Every Rand was accounted for upfront with zero surprises.',
    author: 'Claire van Rooyen',
    estate: 'Silver Lakes Golf Estate · 9-day Executive Travel',
  },
];

export function PromiseTimeline() {
  return (
    <section
      id="promise"
      className="no-print bg-[#121212] text-[#FAF9F6] py-16 sm:py-24 border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-2xl mb-12 sm:mb-16">
          <p className="text-xs sm:text-sm font-medium tracking-[0.14em] uppercase text-[#C5A059] mb-3">
            The 24/7 Peace-of-Mind Promise
          </p>
          <h2
            className="font-display font-medium text-[#FAF9F6] leading-[1.12] tracking-tight mb-4"
            style={{
              fontSize: 'clamp(1.85rem, 3.2vw, 2.85rem)',
              textWrap: 'balance',
            }}
          >
            From Departure Handover to Spotless Return in Three Disciplined Stages
          </h2>
          <p className="text-sm sm:text-base text-[#FAF9F6]/75 leading-relaxed">
            Built for frequent international travellers and Pretoria estate owners who expect hotel
            concierge accountability inside their own residence.
          </p>
        </div>

        {/* 3-Step Visual Timeline */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Desktop Horizontal Connecting Rule */}
          <div
            className="hidden lg:block absolute top-11 left-[8%] right-[8%] h-px bg-[#C5A059]/30"
            aria-hidden="true"
          />

          {TIMELINE_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-[#1A1A1A] border border-white/10 rounded-sm p-6 sm:p-8 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-sm bg-[#121212] border border-[#C5A059]/50 text-[#C5A059] z-10">
                      <Icon className="w-5 h-5 stroke-[1.75]" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-xs tracking-widest text-[#C5A059] tabular-nums">
                      STEP {item.step}
                    </span>
                  </div>

                  <h3 className="font-display text-2xl font-medium text-[#FAF9F6] mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs font-medium text-[#C5A059]/90 mb-4">{item.subtitle}</p>
                  <p className="text-sm text-[#FAF9F6]/75 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Adjacent Client Proof */}
        <div className="mt-12 sm:mt-16 pt-10 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {CLIENT_REFERENCES.map((ref) => (
            <blockquote
              key={ref.author}
              className="bg-[#181818] border border-white/10 rounded-sm p-6 sm:p-8 flex flex-col justify-between gap-5"
            >
              <p className="font-display text-xl sm:text-2xl italic text-[#FAF9F6]/90 leading-snug">
                “{ref.quote}”
              </p>
              <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-[#FAF9F6]/70">
                <span className="font-semibold text-[#FAF9F6]">{ref.author}</span>
                <span aria-hidden="true" className="text-[#C5A059]">
                  ·
                </span>
                <span>{ref.estate}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
