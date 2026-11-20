import { useState } from 'react';
import { ArrowRight, Heart, MapPin, ShieldCheck, Users } from 'lucide-react';
import { PRETORIA_EAST_COVERAGE } from '../data/services';
import { ResilientImage } from './ResilientImage';

interface WhoWeAreSectionProps {
  onSelectSuburbForQuote: (suburbName: string) => void;
}

const OUTSIDE_BOUNDARY_KEY = 'Just Outside Boundary (Custom Travel Rate)';

export function WhoWeAreSection({ onSelectSuburbForQuote }: WhoWeAreSectionProps) {
  const [selectedArea, setSelectedArea] = useState<string>(PRETORIA_EAST_COVERAGE[0].name);

  const isOutsideBoundary = selectedArea === OUTSIDE_BOUNDARY_KEY;
  const activeSuburb = isOutsideBoundary
    ? null
    : PRETORIA_EAST_COVERAGE.find((s) => s.name === selectedArea) ||
      PRETORIA_EAST_COVERAGE[0];

  return (
    <section
      id="who-we-are"
      className="no-print bg-[#121212] text-[#FAF9F6] py-16 sm:py-24 border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs sm:text-sm font-medium tracking-[0.14em] uppercase text-[#C5A059] mb-3">
            Who We Are &amp; Pretoria East Coverage
          </p>
          <h2
            className="font-display font-medium text-[#FAF9F6] leading-[1.12] tracking-tight mb-4"
            style={{
              fontSize: 'clamp(1.85rem, 3.2vw, 2.85rem)',
              textWrap: 'balance',
            }}
          >
            A Local Pretoria East Dad-and-Daughters Team You Can Trust in Your Home
          </h2>
          <p className="text-sm sm:text-base text-[#FAF9F6]/75 leading-relaxed">
            Whether you are traveling abroad or simply at home wanting to reclaim your December
            weekends from chores, errands, and driving, our family works together to care for your
            residence, animals, and peace of mind.
          </p>
        </div>

        {/* Two-Column Feature: Meet the Team (Left) + Satellite Coverage Map (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* 1. Team Photo Card + Personal Bio */}
          <article className="lg:col-span-6 bg-[#1A1A1A] border border-[#C5A059]/45 rounded-sm p-3 sm:p-4 flex flex-col">
            <div className="border border-[#C5A059]/40 rounded-sm overflow-hidden bg-[#121212]">
              <div className="aspect-[4/3] w-full overflow-hidden">
                <ResilientImage
                  src="/images/team-family.jpg"
                  alt="Pretoria East Home & Pet Concierge dad and two daughters smiling outdoors"
                  fallbackTitle="Pretoria East Dad-and-Daughters Team"
                  className="w-full h-full object-cover object-[50%_20%]"
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium tracking-[0.14em] uppercase text-[#C5A059]">
                    Meet the Family
                  </span>
                  <span className="text-xs text-[#FAF9F6]/60">
                    Pretoria East Based · Dad &amp; Daughters
                  </span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl font-medium text-[#FAF9F6]">
                  Hands-On Property Care &amp; Genuine Pet Affection
                </h3>

                <p className="text-sm text-[#FAF9F6]/85 leading-relaxed">
                  We are a local Pretoria East dad-and-daughters team who believe your home and pets
                  deserve real warmth, not a rotating roster of strangers. While I personally handle
                  property oversight, home maintenance, security protocols, and safe private
                  transport, the girls bring endless energy, affection, and supervised playtime for
                  your pets.
                </p>

                <div className="pt-3 space-y-2.5 text-xs sm:text-sm text-[#FAF9F6]/80 border-t border-white/10">
                  <div className="flex items-start gap-2.5 pt-1">
                    <ShieldCheck
                      className="w-4 h-4 text-[#C5A059] mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="text-[#FAF9F6]">Dad’s Oversight:</strong> Residence
                      security checks, pool &amp; handyman maintenance, municipal bin days, and
                      trusted private chauffeur drives.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Heart
                      className="w-4 h-4 text-[#C5A059] mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="text-[#FAF9F6]">Daughters’ Pet Care:</strong> Dedicated
                      supervised garden playtime, gentle companionship, and attentive daily feeding
                      routines.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Users
                      className="w-4 h-4 text-[#C5A059] mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="text-[#FAF9F6]">Family &amp; Kids’ Outings:</strong>{' '}
                      Depending on your children’s ages, the girls can even join for fun kids’
                      outings or supervised home entertainment when needed.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* 2. Pretoria East Satellite Coverage Map + Interactive Suburb Filter */}
          <div className="lg:col-span-6 bg-[#1A1A1A] border border-white/10 rounded-sm p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium tracking-[0.14em] uppercase text-[#C5A059]">
                  Active Red-Bordered Service Zone
                </span>
                <span className="font-mono text-xs text-[#FAF9F6]/70">
                  {activeSuburb ? activeSuburb.responseEta : 'Custom Travel Rate'}
                </span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-medium text-[#FAF9F6] mb-2">
                Pretoria East Coverage Map
              </h3>
              <p className="text-xs sm:text-sm text-[#FAF9F6]/70">
                Our core zero-surcharge service boundary covers the red-outlined Pretoria East
                zone below. Select your suburb to inspect coverage or pre-fill your quote.
              </p>
            </div>

            {/* Attached Satellite Coverage Map */}
            <div className="border border-[#C5A059]/35 rounded-sm overflow-hidden bg-[#121212]">
              <div className="aspect-[16/10] w-full overflow-hidden">
                <ResilientImage
                  src="/images/pretoria-east-coverage-map.jpg"
                  alt="Satellite map showing Pretoria East red-bordered service boundary across Waterkloof, Menlo Park, Lynnwood, Faerie Glen, Garsfontein, Silver Lakes, Moreleta Park, Mooikloof, Erasmuskloof, and Monument Park"
                  fallbackTitle="Pretoria East Coverage Boundary Map"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            {/* Interactive Suburb Filter Buttons */}
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-[#FAF9F6]/75 mb-2.5">
                Suburbs Inside Our Boundary
              </p>
              <div className="flex flex-wrap gap-2">
                {PRETORIA_EAST_COVERAGE.map((suburb) => {
                  const isActive = selectedArea === suburb.name;
                  return (
                    <button
                      key={suburb.name}
                      type="button"
                      onClick={() => setSelectedArea(suburb.name)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-medium rounded-sm border transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-[#C5A059] text-[#121212] border-[#C5A059] font-semibold'
                          : 'bg-[#121212] text-[#FAF9F6]/80 border-white/15 hover:border-[#C5A059]'
                      }`}
                    >
                      <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>{suburb.name}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setSelectedArea(OUTSIDE_BOUNDARY_KEY)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-medium rounded-sm border transition-colors cursor-pointer whitespace-nowrap ${
                    isOutsideBoundary
                      ? 'bg-[#FAF9F6] text-[#121212] border-[#FAF9F6] font-semibold'
                      : 'bg-[#121212] text-[#FAF9F6]/70 border-white/15 hover:border-[#C5A059]'
                  }`}
                >
                  <span>Outside Boundary?</span>
                </button>
              </div>
            </div>

            {/* Selected Boundary Details & Quote Trigger */}
            <div className="p-4 bg-[#121212] border border-white/10 rounded-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  {activeSuburb ? (
                    <>
                      <p className="text-sm font-semibold text-[#FAF9F6]">
                        {activeSuburb.name} ·{' '}
                        <span className="text-[#C5A059] font-normal">
                          {activeSuburb.responseEta}
                        </span>
                      </p>
                      <p className="text-xs text-[#FAF9F6]/70 mt-1">
                        {activeSuburb.highlights}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[#FAF9F6]">
                        Outside the Red Boundary ·{' '}
                        <span className="text-[#C5A059] font-normal">Custom Travel Rate</span>
                      </p>
                      <p className="text-xs text-[#FAF9F6]/70 mt-1">
                        Live in Irene, Woodhill, Rietvalleirand, or nearby? Inquire via your free
                        consultation for a tailored travel allowance.
                      </p>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onSelectSuburbForQuote(selectedArea)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] bg-[#C5A059] hover:bg-[#D4B26E] text-[#121212] text-xs font-semibold rounded-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>
                    {activeSuburb ? `Quote for ${activeSuburb.name}` : 'Inquire Custom Rate'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              <p className="text-[11px] text-[#FAF9F6]/55 pt-2 border-t border-white/10">
                Properties located just outside the red boundary are warmly welcome; simply inquire
                during your free consultation for custom travel rates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
