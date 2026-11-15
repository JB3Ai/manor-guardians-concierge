import { FormEvent, RefObject, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  FileDown,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { PRETORIA_SUBURBS } from '../data/services';
import { LockBookingExecutionResult } from '../services/apiPlaceholders';
import {
  calculateQuoteBreakdown,
  formatZar,
  lockDatesAndInitializeDeposit,
} from '../services/conciergeApi';
import {
  BaseCareTier,
  ClientContactDetails,
  QuoteInput,
} from '../types/concierge';
import { BookingConfirmationModal } from './BookingConfirmationModal';

interface QuoteBookingSectionProps {
  quoteInput: QuoteInput;
  onChangeQuoteInput: (next: QuoteInput) => void;
  startDateInputRef?: RefObject<HTMLInputElement | null>;
}

const INITIAL_CONTACT: ClientContactDetails = {
  fullName: '',
  suburbOrEstate: PRETORIA_SUBURBS[0],
  whatsappPhone: '',
  email: '',
  specialInstructions: '',
};

const BASE_TIERS: Array<{
  id: BaseCareTier;
  title: string;
  rateLabel: string;
  description: string;
}> = [
  {
    id: 'vip-24-7',
    title: '24/7 VIP Estate & Pet Care',
    rateLabel: 'R1,350 / day',
    description:
      'Dedicated live-in guardian residing on-site 24/7, timed morning & evening photo updates, and routine pool/garden checks.',
  },
  {
    id: 'daily-drop-in',
    title: 'Daily Drop-In Visits',
    rateLabel: 'R650 / day',
    description:
      'Two scheduled daily visits (morning & evening) for feeding, fresh water, post collection, and perimeter inspection.',
  },
];

export function QuoteBookingSection({
  quoteInput,
  onChangeQuoteInput,
  startDateInputRef,
}: QuoteBookingSectionProps) {
  const [contact, setContact] = useState<ClientContactDetails>(INITIAL_CONTACT);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isLocking, setIsLocking] = useState(false);
  const [modalResult, setModalResult] = useState<LockBookingExecutionResult | null>(null);
  const ownerNameInputRef = useRef<HTMLInputElement>(null);

  const breakdown = useMemo(() => calculateQuoteBreakdown(quoteInput), [quoteInput]);

  const updateField = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => {
    onChangeQuoteInput({ ...quoteInput, [key]: value });
  };

  const handleLoadHolidaySample = () => {
    onChangeQuoteInput({
      ...quoteInput,
      checkInDate: '2026-12-20',
      checkOutDate: '2026-12-30',
    });
  };

  const handleStepAirportTrips = (delta: number) => {
    const next = Math.max(0, Math.min(10, quoteInput.airportTrips + delta));
    updateField('airportTrips', next);
  };

  const validateAndLockBooking = async () => {
    const errors: string[] = [];

    if (breakdown.totalDays <= 0) {
      errors.push('Please select an End Date after your Start Date.');
    }
    if (contact.fullName.trim().length < 2) {
      errors.push('Please enter your Full Name under Estate Owner Details.');
    }
    if (!contact.whatsappPhone.trim() || contact.whatsappPhone.replace(/\D/g, '').length < 9) {
      errors.push('Please enter a valid WhatsApp / Mobile Number (at least 9 digits).');
    }
    if (!contact.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      errors.push('Please enter a valid Email Address for your Pro-Forma Invoice.');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      if (contact.fullName.trim().length < 2) {
        ownerNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ownerNameInputRef.current?.focus();
      }
      return;
    }

    setFormErrors([]);
    setIsLocking(true);
    try {
      const result = await lockDatesAndInitializeDeposit(quoteInput, contact, breakdown);
      setModalResult(result);
    } finally {
      setIsLocking(false);
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await validateAndLockBooking();
  };

  const handleGeneratePdfQuote = () => {
    window.print();
  };

  const proFormaDate = new Date().toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <section
      id="quote"
      className="bg-[#FAF9F6] text-[#121212] py-16 sm:py-24 border-b border-[#121212]/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading (hidden in PDF print) */}
        <div className="no-print flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-[#121212]/10">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-medium tracking-[0.14em] uppercase text-[#8A6A2B] mb-3">
              Instant Quote &amp; Booking
            </p>
            <h2
              className="font-display font-medium text-[#121212] leading-[1.12] tracking-tight"
              style={{
                fontSize: 'clamp(1.85rem, 3.2vw, 2.85rem)',
                textWrap: 'balance',
              }}
            >
              Configure Your Dates, Tier &amp; Instant Pro-Forma Invoice
            </h2>
          </div>

          <button
            type="button"
            onClick={handleLoadHolidaySample}
            className="inline-flex items-center gap-2 self-start lg:self-auto text-xs sm:text-sm font-medium text-[#121212] border border-[#121212]/20 hover:border-[#C5A059] bg-white px-4 py-2.5 min-h-[44px] rounded-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Calendar className="w-4 h-4 text-[#A6833E]" aria-hidden="true" />
            <span>Preview Dec 20 – Dec 30 Festive Dates</span>
          </button>
        </div>

        {/* Two-Column Calculator & Live Pro-Forma Invoice */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mt-10 items-start">
          {/* Left Column: Configurator Form (hidden in PDF print) */}
          <form
            onSubmit={handleFormSubmit}
            noValidate
            className="no-print lg:col-span-7 bg-white border border-[#121212]/10 rounded-sm p-6 sm:p-8 space-y-8"
          >
            {/* 01. Interactive Date Range Picker */}
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                <h3 className="font-display text-2xl font-medium text-[#121212]">
                  01. Interactive Date Range Picker
                </h3>
                <span className="font-mono text-xs font-medium text-[#8A6A2B] tabular-nums">
                  {breakdown.totalDays} {breakdown.totalDays === 1 ? 'day' : 'days'} selected
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#121212]/65 mb-5">
                Any dates falling between December 20 and January 2 automatically trigger the +25%
                Peak Festive Surcharge.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="check-in-date"
                    className="block text-xs font-semibold tracking-wide text-[#121212]/80 mb-1.5"
                  >
                    Start Date (Arrival / Handover)
                  </label>
                  <input
                    ref={startDateInputRef}
                    id="check-in-date"
                    type="date"
                    value={quoteInput.checkInDate}
                    onChange={(e) => updateField('checkInDate', e.target.value)}
                    className="w-full min-h-[46px] px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#121212]/20 rounded-sm text-[#121212] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="check-out-date"
                    className="block text-xs font-semibold tracking-wide text-[#121212]/80 mb-1.5"
                  >
                    End Date (Owner Return)
                  </label>
                  <input
                    id="check-out-date"
                    type="date"
                    value={quoteInput.checkOutDate}
                    min={quoteInput.checkInDate}
                    onChange={(e) => updateField('checkOutDate', e.target.value)}
                    className="w-full min-h-[46px] px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#121212]/20 rounded-sm text-[#121212] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Automatic Festive Detection Callout */}
              {breakdown.totalDays <= 0 ? (
                <p className="mt-3 text-xs text-[#991B1B] font-medium">
                  Select an End Date after your Start Date to compute your ZAR tariff.
                </p>
              ) : breakdown.hasFestiveDates ? (
                <div className="mt-4 p-3.5 bg-[#FAF5EB] border border-[#C5A059]/60 rounded-sm text-xs sm:text-sm text-[#121212] flex items-center justify-between gap-3 tabular-nums">
                  <span>
                    <strong className="font-semibold text-[#8A6A2B]">
                      Peak Festive Window Detected:
                    </strong>{' '}
                    {breakdown.peakFestiveDays} of {breakdown.totalDays} days fall within Dec 20 –
                    Jan 2 (+25% surcharge applied).
                  </span>
                  <span className="font-semibold text-[#8A6A2B] whitespace-nowrap">
                    +{formatZar(breakdown.peakSurchargeSubtotal)}
                  </span>
                </div>
              ) : (
                <p className="mt-3 text-xs text-[#121212]/65 tabular-nums">
                  Standard seasonal tariff applies across all {breakdown.totalDays} days (outside
                  Dec 20 – Jan 2).
                </p>
              )}
            </div>

            {/* 02. Base Care Tier & Add-On Selector */}
            <div className="pt-6 border-t border-[#121212]/10">
              <h3 className="font-display text-2xl font-medium text-[#121212] mb-4">
                02. Service Tier &amp; Concierge Add-Ons
              </h3>

              {/* Base Tier Radio Cards */}
              <div
                role="radiogroup"
                aria-label="Base service tier"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
              >
                {BASE_TIERS.map((tier) => {
                  const isSelected = quoteInput.baseTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => updateField('baseTier', tier.id)}
                      className={`text-left p-4 rounded-sm border transition-colors cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#121212] text-[#FAF9F6] border-[#C5A059]'
                          : 'bg-[#FAF9F6] text-[#121212] border-[#121212]/15 hover:border-[#C5A059]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-display text-xl font-medium leading-tight">
                          {tier.title}
                        </span>
                        <span
                          className={`text-xs font-semibold tabular-nums whitespace-nowrap ${
                            isSelected ? 'text-[#C5A059]' : 'text-[#8A6A2B]'
                          }`}
                        >
                          {tier.rateLabel}
                        </span>
                      </div>
                      <p
                        className={`text-xs leading-relaxed ${
                          isSelected ? 'text-[#FAF9F6]/75' : 'text-[#121212]/70'
                        }`}
                      >
                        {tier.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Add-On Controls */}
              <div className="space-y-3">
                {/* Airport Drop-off / Pick-up Counter */}
                <div className="p-4 bg-[#FAF9F6] border border-[#121212]/15 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-[#121212]">
                      Airport Drop-off / Pick-up Transfers
                    </span>
                    <span className="block text-xs text-[#121212]/65">
                      OR Tambo or Lanseria terminal chauffeur · R450 per trip
                    </span>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleStepAirportTrips(-1)}
                      disabled={quoteInput.airportTrips <= 0}
                      aria-label="Decrease airport transfer trips"
                      className="w-11 h-11 inline-flex items-center justify-center border border-[#121212]/20 bg-white hover:border-[#C5A059] disabled:opacity-40 rounded-sm cursor-pointer transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-16 text-center text-sm font-semibold tabular-nums">
                      {quoteInput.airportTrips}{' '}
                      {quoteInput.airportTrips === 1 ? 'trip' : 'trips'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStepAirportTrips(1)}
                      aria-label="Increase airport transfer trips"
                      className="w-11 h-11 inline-flex items-center justify-center border border-[#121212]/20 bg-white hover:border-[#C5A059] rounded-sm cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* "Welcome Home" Reset Checkbox */}
                <label className="flex items-start gap-3 p-4 bg-[#FAF9F6] border border-[#121212]/15 rounded-sm cursor-pointer hover:border-[#C5A059] transition-colors">
                  <input
                    type="checkbox"
                    checked={quoteInput.includeWelcomeReset}
                    onChange={(e) => updateField('includeWelcomeReset', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-[#C5A059]"
                  />
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-sm font-semibold text-[#121212]">
                        “Welcome Home” Reset
                      </span>
                      <span className="block text-xs text-[#121212]/65">
                        Full pre-return deep clean, freshly laundered linens &amp; fridge essentials
                        stocked
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[#8A6A2B] tabular-nums whitespace-nowrap">
                      + R600
                    </span>
                  </div>
                </label>

                {/* Pre-Arrival Power Wash / Minor Maintenance Checkbox */}
                <label className="flex items-start gap-3 p-4 bg-[#FAF9F6] border border-[#121212]/15 rounded-sm cursor-pointer hover:border-[#C5A059] transition-colors">
                  <input
                    type="checkbox"
                    checked={quoteInput.includePreArrivalMaintenance}
                    onChange={(e) =>
                      updateField('includePreArrivalMaintenance', e.target.checked)
                    }
                    className="mt-1 w-4 h-4 accent-[#C5A059]"
                  />
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-sm font-semibold text-[#121212]">
                        Pre-Arrival Power Wash / Minor Maintenance
                      </span>
                      <span className="block text-xs text-[#121212]/65">
                        Travertine terrace &amp; driveway high-pressure wash, gutter clear &amp;
                        minor fixture checks
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[#8A6A2B] tabular-nums whitespace-nowrap">
                      + R850
                    </span>
                  </div>
                </label>

                {/* Optional Concierge Driving & Pet Count */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label
                      htmlFor="pet-count"
                      className="block text-xs font-semibold tracking-wide text-[#121212]/80 mb-1.5"
                    >
                      Pets Under Care
                    </label>
                    <input
                      id="pet-count"
                      type="number"
                      min={0}
                      max={15}
                      value={quoteInput.petCount}
                      onChange={(e) =>
                        updateField('petCount', Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#FAF9F6] border border-[#121212]/20 rounded-sm text-[#121212] tabular-nums focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="errand-hours"
                      className="block text-xs font-semibold tracking-wide text-[#121212]/80 mb-1.5"
                    >
                      Errand Hours (R250/hr)
                    </label>
                    <input
                      id="errand-hours"
                      type="number"
                      min={0}
                      max={40}
                      value={quoteInput.errandHours}
                      onChange={(e) =>
                        updateField('errandHours', Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#FAF9F6] border border-[#121212]/20 rounded-sm text-[#121212] tabular-nums focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="errand-km"
                      className="block text-xs font-semibold tracking-wide text-[#121212]/80 mb-1.5"
                    >
                      Errand Distance (R8/km)
                    </label>
                    <input
                      id="errand-km"
                      type="number"
                      min={0}
                      max={1000}
                      step={5}
                      value={quoteInput.errandKilometers}
                      onChange={(e) =>
                        updateField('errandKilometers', Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#FAF9F6] border border-[#121212]/20 rounded-sm text-[#121212] tabular-nums focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 03. Estate Owner Details */}
            <div className="pt-6 border-t border-[#121212]/10">
              <h3 className="font-display text-2xl font-medium text-[#121212] mb-4">
                03. Estate Owner Details (Required to Lock Dates)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="owner-name"
                    className="block text-xs font-semibold tracking-wide text-[#121212]/80 mb-1.5"
                  >
                    Full Name *
                  </label>
                  <input
                    ref={ownerNameInputRef}
                    id="owner-name"
                    type="text"
                    required
                    placeholder="e.g. Dr. Johan Pretorius"
                    value={contact.fullName}
                    onChange={(e) => setContact({ ...contact, fullName: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#121212]/20 rounded-sm text-[#121212] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="estate-suburb"
                    className="block text-xs font-semibold tracking-wide text-[#121212]/80 mb-1.5"
                  >
                    Pretoria Estate / Suburb *
                  </label>
                  <select
                    id="estate-suburb"
                    value={contact.suburbOrEstate}
                    onChange={(e) => setContact({ ...contact, suburbOrEstate: e.target.value })}
                    className="w-full min-h-[44px] px-3 py-2.5 text-sm bg-[#FAF9F6] border border-[#121212]/20 rounded-sm text-[#121212] focus:outline-none focus:border-[#C5A059]"
                  >
                    {PRETORIA_SUBURBS.map((suburb) => (
                      <option key={suburb} value={suburb}>
                        {suburb}
                      </option>
                    ))}
                    <option value="Other Pretoria Residence">Other Pretoria Residence</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="owner-whatsapp"
                    className="block text-xs font-semibold tracking-wide text-[#121212]/80 mb-1.5"
                  >
                    WhatsApp Number *
                  </label>
                  <input
                    id="owner-whatsapp"
                    type="tel"
                    required
                    placeholder="+27 82 000 0000"
                    value={contact.whatsappPhone}
                    onChange={(e) => setContact({ ...contact, whatsappPhone: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#121212]/20 rounded-sm text-[#121212] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="owner-email"
                    className="block text-xs font-semibold tracking-wide text-[#121212]/80 mb-1.5"
                  >
                    Email Address *
                  </label>
                  <input
                    id="owner-email"
                    type="email"
                    required
                    placeholder="name@domain.co.za"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#121212]/20 rounded-sm text-[#121212] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>
            </div>

            {formErrors.length > 0 && (
              <div
                role="alert"
                className="p-4 bg-[#FFF5F5] border border-[#B91C1C]/30 rounded-sm text-sm text-[#991B1B] space-y-1"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Before locking your dates:</span>
                </div>
                <ul className="list-disc pl-5 text-xs sm:text-sm space-y-0.5">
                  {formErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </form>

          {/* Right Column: Live Itemized Quote & Pro-Forma Invoice Card (Print-Ready) */}
          <aside className="print-invoice-surface lg:col-span-5 bg-[#121212] text-[#FAF9F6] rounded-sm p-6 sm:p-8 border border-[#C5A059]/30 lg:sticky lg:top-24">
            {/* Pro-Forma Branded Header */}
            <div className="pb-5 border-b border-white/15 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck
                    className="print-gold-accent w-4 h-4 text-[#C5A059]"
                    aria-hidden="true"
                  />
                  <span className="print-gold-accent text-xs font-medium tracking-[0.14em] uppercase text-[#C5A059]">
                    Pro-Forma Invoice · The Manor Guardians
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-medium text-[#FAF9F6]">
                  Itemized ZAR Quote
                </h3>
                <p className="text-xs text-[#FAF9F6]/65 mt-1">
                  {quoteInput.checkInDate} → {quoteInput.checkOutDate} · {breakdown.totalDays}{' '}
                  {breakdown.totalDays === 1 ? 'day' : 'days'}
                </p>
              </div>
              <div className="text-right font-mono text-[11px] text-[#FAF9F6]/60 tabular-nums">
                <div>Issued {proFormaDate}</div>
                <div>Pretoria, ZA</div>
              </div>
            </div>

            {/* Client Metadata Summary (especially helpful on PDF print) */}
            {(contact.fullName || contact.suburbOrEstate) && (
              <div className="py-3 border-b border-white/10 text-xs text-[#FAF9F6]/75 flex flex-wrap justify-between gap-2">
                <span>
                  Prepared for:{' '}
                  <strong className="text-[#FAF9F6]">
                    {contact.fullName || 'Prospective Estate Client'}
                  </strong>
                </span>
                <span>{contact.suburbOrEstate}</span>
              </div>
            )}

            {/* Itemized Line Items */}
            <dl className="py-5 space-y-3.5 text-sm tabular-nums">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <dt className="text-[#FAF9F6]">{breakdown.baseTierLabel}</dt>
                  <dd className="text-xs text-[#FAF9F6]/60">
                    {breakdown.totalDays} days × {formatZar(breakdown.dailyRateZar)} / day
                  </dd>
                </div>
                <dd className="font-medium text-[#FAF9F6]">
                  {formatZar(breakdown.baseCareSubtotal)}
                </dd>
              </div>

              {breakdown.airportTransferSubtotal > 0 && (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <dt className="text-[#FAF9F6]">Airport Drop-off / Pick-up</dt>
                    <dd className="text-xs text-[#FAF9F6]/60">
                      {quoteInput.airportTrips} trip(s) × R450
                    </dd>
                  </div>
                  <dd className="font-medium text-[#FAF9F6]">
                    {formatZar(breakdown.airportTransferSubtotal)}
                  </dd>
                </div>
              )}

              {breakdown.welcomeResetSubtotal > 0 && (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <dt className="text-[#FAF9F6]">“Welcome Home” Reset</dt>
                    <dd className="text-xs text-[#FAF9F6]/60">
                      Deep clean, fresh linens &amp; fridge stock
                    </dd>
                  </div>
                  <dd className="font-medium text-[#FAF9F6]">
                    {formatZar(breakdown.welcomeResetSubtotal)}
                  </dd>
                </div>
              )}

              {breakdown.preArrivalMaintenanceSubtotal > 0 && (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <dt className="text-[#FAF9F6]">
                      Pre-Arrival Power Wash / Minor Maintenance
                    </dt>
                    <dd className="text-xs text-[#FAF9F6]/60">
                      Paving &amp; terrace wash, exterior check
                    </dd>
                  </div>
                  <dd className="font-medium text-[#FAF9F6]">
                    {formatZar(breakdown.preArrivalMaintenanceSubtotal)}
                  </dd>
                </div>
              )}

              {breakdown.conciergeDrivingSubtotal > 0 && (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <dt className="text-[#FAF9F6]">Concierge Driving &amp; Errands</dt>
                    <dd className="text-xs text-[#FAF9F6]/60">
                      {quoteInput.errandHours} hr @ R250 + {quoteInput.errandKilometers} km @ R8
                    </dd>
                  </div>
                  <dd className="font-medium text-[#FAF9F6]">
                    {formatZar(breakdown.conciergeDrivingSubtotal)}
                  </dd>
                </div>
              )}

              {/* Subtotal Line */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[#FAF9F6]/85">
                <dt>Subtotal (Before Festive Surcharge)</dt>
                <dd className="font-medium">{formatZar(breakdown.subtotalBeforePeak)}</dd>
              </div>

              {/* Peak Surcharge Line (when applicable) */}
              {breakdown.peakSurchargeSubtotal > 0 && (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <dt className="print-gold-accent text-[#C5A059] font-medium">
                      Peak Festive Surcharge (+25%)
                    </dt>
                    <dd className="text-xs text-[#FAF9F6]/60">
                      Dec 20 – Jan 2 ({breakdown.peakFestiveDays} festive{' '}
                      {breakdown.peakFestiveDays === 1 ? 'day' : 'days'})
                    </dd>
                  </div>
                  <dd className="print-gold-accent font-semibold text-[#C5A059]">
                    +{formatZar(breakdown.peakSurchargeSubtotal)}
                  </dd>
                </div>
              )}
            </dl>

            {/* Total Amount & 50% Deposit Box */}
            <div className="pt-5 border-t border-white/15 space-y-2.5 tabular-nums">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-[#FAF9F6]/80">Total Amount</span>
                <span className="font-display text-3xl sm:text-4xl font-semibold text-[#FAF9F6]">
                  {formatZar(breakdown.estimatedTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
                <span className="print-gold-accent font-semibold text-[#C5A059]">
                  Required 50% Deposit to Lock Dates
                </span>
                <span className="print-gold-accent font-bold text-[#C5A059]">
                  {formatZar(breakdown.depositAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-[#FAF9F6]/60">
                <span>Remaining 50% Balance on Handover</span>
                <span>{formatZar(breakdown.balanceOnArrival)}</span>
              </div>
            </div>

            {/* Action Buttons (hidden in PDF print) */}
            <div className="no-print mt-6 pt-5 border-t border-white/10 space-y-3">
              <button
                type="button"
                onClick={validateAndLockBooking}
                disabled={isLocking}
                className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-[#C5A059] hover:bg-[#D4B26E] disabled:opacity-60 text-[#121212] font-semibold text-sm sm:text-base px-5 py-3 rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF9F6]"
              >
                <Lock className="w-4 h-4 stroke-[2]" aria-hidden="true" />
                <span>
                  {isLocking
                    ? 'Initializing Paystack & Calendar Hold…'
                    : 'Lock Dates & Pay 50% Deposit'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleGeneratePdfQuote}
                className="flex items-center justify-center gap-2 w-full min-h-[44px] border border-white/25 hover:border-[#C5A059] bg-[#181818] text-[#FAF9F6] font-medium text-xs sm:text-sm px-4 py-2.5 rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
              >
                <FileDown className="w-4 h-4 text-[#C5A059]" aria-hidden="true" />
                <span>Generate Branded PDF Quote</span>
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Confirmation Modal */}
      <BookingConfirmationModal
        result={modalResult}
        onClose={() => setModalResult(null)}
      />
    </section>
  );
}
