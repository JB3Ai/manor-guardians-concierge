import { Camera, ClipboardCheck, Handshake } from 'lucide-react';

const TIMELINE_STEPS = [
  {
    step: '01',
    title: 'Instant Estimate & Free Vetting Consultation',
    subtitle: 'Online video call or in-home meet & greet + pet introduction',
    description:
      'Use our calculator to estimate your ZAR tariff and pick your services. We never charge upfront online. Every new client starts with a free meet-and-greet and mandatory pet introduction so your animals feel relaxed and safe with our family.',
    icon: Handshake,
  },
  {
    step: '02',
    title: 'Digital Residence & Pet Onboarding',
    subtitle: 'Pre-start home, security & veterinary dossier',
    description:
      'Once both you and your pets are completely comfortable, confirm your dates and complete one structured digital intake covering gate access, armed response, bin collection days, feeding portions, and house quirks.',
    icon: ClipboardCheck,
  },
  {
    step: '03',
    title: 'Daily Photo Updates & Welcome Refresh',
    subtitle: '08:00 & 18:00 WhatsApp dispatches · Flowers & pantry stocked',
    description:
      'Receive punctual morning and evening photo updates while away, or enjoy effortless at-home chore, school-run, and hosting support. Your stay finishes with fresh bread, milk, crisp linens, and fresh flowers waiting for you.',
    icon: Camera,
  },
];

export function PromiseTimeline() {
  return (
    <section
      id="promise"
      className="no-print bg-[#FAF9F6] text-[#121212] py-16 sm:py-24 border-b border-[#121212]/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-2xl mb-12 sm:mb-16">
          <p className="text-xs sm:text-sm font-medium tracking-[0.14em] uppercase text-[#8A6A2B] mb-3">
            The 24/7 Peace-of-Mind Promise
          </p>
          <h2
            className="font-display font-medium text-[#121212] leading-[1.12] tracking-tight mb-4"
            style={{
              fontSize: 'clamp(1.85rem, 3.2vw, 2.85rem)',
              textWrap: 'balance',
            }}
          >
            Free Vetting Consultation First, Zero Upfront Pressure
          </h2>
          <p className="text-sm sm:text-base text-[#121212]/70 leading-relaxed">
            Built around personal trust for Pretoria East families, whether you are flying abroad or
            staying home and reclaiming your December weekends.
          </p>
        </div>

        {/* 3-Step Visual Timeline */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div
            className="hidden lg:block absolute top-11 left-[8%] right-[8%] h-px bg-[#C5A059]/45"
            aria-hidden="true"
          />

          {TIMELINE_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-white border border-[#121212]/10 rounded-sm p-6 sm:p-8 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-sm bg-[#121212] border border-[#C5A059] text-[#C5A059] z-10">
                      <Icon className="w-5 h-5 stroke-[1.75]" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-xs tracking-widest text-[#8A6A2B] tabular-nums">
                      STEP {item.step}
                    </span>
                  </div>

                  <h3 className="font-display text-2xl font-medium text-[#121212] mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs font-medium text-[#8A6A2B] mb-4">{item.subtitle}</p>
                  <p className="text-sm text-[#121212]/75 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
