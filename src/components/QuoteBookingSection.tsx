import { FormEvent, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  FileDown,
  Handshake,
  Home,
  Minus,
  Plane,
  Plus,
  ShieldCheck,
  Video,
  X,
} from 'lucide-react';
import {
  BRAND_NAME,
  CURATED_DAY_TRIPS,
  PRETORIA_SUBURBS,
  SPECIALIST_ON_REQUEST_SERVICES,
} from '../data/services';
import { ConsultationRequestResult } from '../services/apiPlaceholders';
import {
  calculateQuoteBreakdown,
  formatZar,
  requestFreeConsultation,
} from '../services/conciergeApi';
import {
  BaseCareTier,
  ClientContactDetails,
  ConsultationPreference,
  QuoteInput,
  StayContextMode,
} from '../types/concierge';
import { BookingConfirmationModal } from './BookingConfirmationModal';

interface QuoteBookingSectionProps {
  quoteInput: QuoteInput;
  selectedSuburb?: string;
  onChangeQuoteInput: (next: QuoteInput) => void;
  startDateInputRef?: RefObject<HTMLInputElement | null>;
}

const INITIAL_CONTACT: ClientContactDetails = {
  fullName: '',
  suburbOrResidence: PRETORIA_SUBURBS[0],
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
    title: '24/7 Live-In Residence & Pet Care',
    rateLabel: 'R1,350 / day',
    description:
      'Continuous live-in presence, dog feeding/playtime, watering plants, bin collection, pool upkeep, and timed daily WhatsApp updates.',
  },
  {
    id: 'daily-drop-in',
    title: 'Daily Check-In Visits',
    rateLabel: 'R650 / day',
    description:
      'Morning & evening home visits for feeding, supervised playtime, municipal bin days, post collection, and pool/plant checks.',
  },
];

interface MultiSelectDropdownProps {
  id: string;
  label: string;
  placeholder: string;
  options: readonly string[];
  selectedValues: string[];
  onToggleValue: (value: string) => void;
  onClearAll: () => void;
}

function MultiSelectDropdown({
  id,
  label,
  placeholder,
  options,
  selectedValues,
  onToggleValue,
  onClearAll,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const triggerText =
    selectedValues.length === 0
      ? placeholder
      : selectedValues.length === 1
        ? selectedValues[0]
        : `${selectedValues.length} selected · ${selectedValues[0]}`;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-end justify-between gap-2 mb-1.5 sm:min-h-[2.25rem]">
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-[#8A6A2B] leading-snug"
        >
          {label}
        </label>
        {selectedValues.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] font-medium text-[#121212]/60 hover:text-[#121212] underline underline-offset-2 cursor-pointer shrink-0"
          >
            Clear ({selectedValues.length})
          </button>
        )}
      </div>

      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[46px] px-3.5 py-2.5 text-sm bg-[#FAF9F6] border rounded-sm flex items-center justify-between gap-3 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:border-[#C5A059] ${
          isOpen
            ? 'border-[#C5A059] bg-white'
            : selectedValues.length > 0
              ? 'border-[#C5A059]/75 text-[#121212]'
              : 'border-[#121212]/20 hover:border-[#C5A059]'
        }`}
      >
        <span
          className={`truncate ${
            selectedValues.length === 0 ? 'text-[#121212]/55' : 'text-[#121212] font-medium'
          }`}
        >
          {triggerText}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#8A6A2B] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          className="absolute left-0 right-0 z-30 mt-1.5 bg-white border border-[#121212]/20 shadow-xl rounded-sm overflow-hidden"
        >
          <div className="max-h-64 overflow-y-auto divide-y divide-[#121212]/8">
            {options.map((option) => {
              const checked = selectedValues.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => onToggleValue(option)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 text-left text-xs sm:text-[13px] flex items-start gap-3 transition-colors cursor-pointer ${
                    checked
                      ? 'bg-[#FAF5EB] text-[#121212] font-medium'
                      : 'bg-white text-[#121212]/85 hover:bg-[#FAF9F6]'
                  }`}
                >
                  <span
                    className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                      checked
                        ? 'bg-[#121212] border-[#C5A059] text-[#C5A059]'
                        : 'bg-[#FAF9F6] border-[#121212]/30 text-transparent'
                    }`}
                    aria-hidden="true"
                  >
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </span>
                  <span className="leading-snug">{option}</span>
                </button>
              );
            })}
          </div>

          <div className="px-3.5 py-2 bg-[#FAF9F6] border-t border-[#121212]/10 flex items-center justify-between text-xs">
            <span className="text-[#121212]/60 tabular-nums">
              {selectedValues.length} selected
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-semibold text-[#8A6A2B] hover:text-[#121212] px-2 py-1 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {selectedValues.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-[#121212]/75">
          {selectedValues.map((item) => (
            <li key={item} className="flex items-start justify-between gap-2 leading-snug">
              <span className="truncate">· {item}</span>
              <button
                type="button"
                onClick={() => onToggleValue(item)}
                aria-label={`Remove ${item}`}
                className="text-[#121212]/50 hover:text-[#991B1B] shrink-0 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function QuoteBookingSection({
  quoteInput,
  selectedSuburb,
  onChangeQuoteInput,
  startDateInputRef,
}: QuoteBookingSectionProps) {
  const [contact, setContact] = useState<ClientContactDetails>(INITIAL_CONTACT);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalResult, setModalResult] = useState<ConsultationRequestResult | null>(null);
  const ownerNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedSuburb) {
      setContact((prev) => ({ ...prev, suburbOrResidence: selectedSuburb }));
    }
  }, [selectedSuburb]);

  const breakdown = useMemo(() => calculateQuoteBreakdown(quoteInput), [quoteInput]);

  const updateField = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => {
    onChangeQuoteInput({ ...quoteInput, [key]: value });
  };

  const toggleArrayField = (
    key: 'selectedDayTrips' | 'requestedSpecialistServices',
    value: string
  ) => {
    const current = quoteInput[key];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    updateField(key, next);
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

  const validateAndRequestConsultation = async () => {
    const errors: string[] = [];

    if (breakdown.totalDays <= 0) {
      errors.push('Please select an End Date after your Start Date.');
    }
    if (contact.fullName.trim().length < 2) {
      errors.push('Please enter your Full Name under Residence Contact Details.');
    }
    if (!contact.whatsappPhone.trim() || contact.whatsappPhone.replace(/\D/g, '').length < 9) {
      errors.push('Please enter a valid South African WhatsApp number (at least 9 digits).');
    }
    if (!contact.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      errors.push('Please enter a valid Email Address for your quote & consultation summary.');
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
    setIsSubmitting(true);
    try {
      const result = await requestFreeConsultation(quoteInput, contact);
      setModalResult(result);
    } catch (error) {
      setFormErrors([
        error instanceof Error ? error.message : 'The consultation request could not be saved.',
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await validateAndRequestConsultation();
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
      className="bg-[#F1EFEA] text-[#121212] py-16 sm:py-24 border-b border-[#121212]/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading (hidden in PDF print) */}
        <div className="no-print flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-[#121212]/10">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-medium tracking-[0.14em] uppercase text-[#8A6A2B] mb-3">
              Interactive Quote Estimator &amp; Free Consultation
            </p>
            <h2
              className="font-display font-medium text-[#121212] leading-[1.12] tracking-tight"
              style={{
                fontSize: 'clamp(1.85rem, 3.2vw, 2.85rem)',
                textWrap: 'balance',
              }}
            >
              Calculate Your Estimate, Then Meet Us Free First
            </h2>
          </div>

          <button
            type="button"
            onClick={handleLoadHolidaySample}
            className="inline-flex items-center gap-2 self-start lg:self-auto text-xs sm:text-sm font-medium text-[#121212] border border-[#121212]/20 hover:border-[#C5A059] bg-white px-4 py-2.5 min-h-[44px] rounded-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Calendar className="w-4 h-4 text-[#A6833E]" aria-hidden="true" />
            <span>Preview Dec 20 to Dec 30 Festive Dates</span>
          </button>
        </div>

        {/* Two-Column Estimator + Live Pro-Forma Quote Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mt-10 items-start">
          {/* Left Column: Configurator Form (hidden in PDF print) */}
          <form
            onSubmit={handleFormSubmit}
            noValidate
            className="no-print lg:col-span-7 bg-white border border-[#121212]/10 rounded-sm p-6 sm:p-8 space-y-8"
          >
            {/* 01. Context & Date Range Picker */}
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                <h3 className="font-display text-2xl font-medium text-[#121212]">
                  01. How Can We Help &amp; Preferred Dates
                </h3>
                <span className="font-mono text-xs font-medium text-[#8A6A2B] tabular-nums">
                  {breakdown.totalDays} {breakdown.totalDays === 1 ? 'day' : 'days'} selected
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#121212]/65 mb-4">
                Whether you are traveling or relaxing at home wanting to offload December chores and
                driving, select your dates below.
              </p>

              {/* Stay Context Switch: Traveling vs At Home */}
              <div
                role="radiogroup"
                aria-label="Residence care context"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5"
              >
                {(
                  [
                    {
                      id: 'away-travel' as StayContextMode,
                      title: 'We Are Traveling / Away',
                      desc: '24/7 live-in residence care, pets & timed photo dispatches',
                      icon: Plane,
                    },
                    {
                      id: 'at-home-support' as StayContextMode,
                      title: 'We Are at Home: Offload Chores',
                      desc: 'Help with errands, hosting prep, school runs & outings',
                      icon: Home,
                    },
                  ] as const
                ).map((ctx) => {
                  const Icon = ctx.icon;
                  const active = quoteInput.stayContext === ctx.id;
                  return (
                    <button
                      key={ctx.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => updateField('stayContext', ctx.id)}
                      className={`text-left p-3.5 rounded-sm border transition-colors cursor-pointer flex items-start gap-3 ${
                        active
                          ? 'bg-[#121212] text-[#FAF9F6] border-[#C5A059]'
                          : 'bg-[#FAF9F6] text-[#121212] border-[#121212]/15 hover:border-[#C5A059]'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          active ? 'text-[#C5A059]' : 'text-[#8A6A2B]'
                        }`}
                        aria-hidden="true"
                      />
                      <div>
                        <span className="block text-xs sm:text-sm font-semibold">{ctx.title}</span>
                        <span
                          className={`block text-[11px] mt-0.5 ${
                            active ? 'text-[#FAF9F6]/70' : 'text-[#121212]/65'
                          }`}
                        >
                          {ctx.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="check-in-date"
                    className="block text-xs font-semibold tracking-wide text-[#121212]/80 mb-1.5"
                  >
                    Start Date
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
                    End Date
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

              {breakdown.totalDays <= 0 ? (
                <p className="mt-3 text-xs text-[#991B1B] font-medium">
                  Select an End Date after your Start Date to compute your ZAR estimate.
                </p>
              ) : breakdown.hasFestiveDates ? (
                <div className="mt-4 p-3.5 bg-[#FAF5EB] border border-[#C5A059]/60 rounded-sm text-xs sm:text-sm text-[#121212] flex items-center justify-between gap-3 tabular-nums">
                  <span>
                    <strong className="font-semibold text-[#8A6A2B]">
                      Peak Festive Window Detected:
                    </strong>{' '}
                    {breakdown.peakFestiveDays} of {breakdown.totalDays} days fall within Dec 20 to
                    Jan 2 (+25% surcharge).
                  </span>
                  <span className="font-semibold text-[#8A6A2B] whitespace-nowrap">
                    +{formatZar(breakdown.peakSurchargeSubtotal)}
                  </span>
                </div>
              ) : (
                <p className="mt-3 text-xs text-[#121212]/65 tabular-nums">
                  Standard seasonal tariff applies across all {breakdown.totalDays} days.
                </p>
              )}
            </div>

            {/* 02. Core Care Tier & Priced Add-Ons */}
            <div className="pt-6 border-t border-[#121212]/10">
              <h3 className="font-display text-2xl font-medium text-[#121212] mb-4">
                02. Core Residence Care &amp; Add-Ons
              </h3>

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

              <div className="space-y-3">
                {/* Airport Transfers Counter */}
                <div className="p-4 bg-[#FAF9F6] border border-[#121212]/15 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-[#121212]">
                      Airport Drop-off / Pick-up Transfers
                    </span>
                    <span className="block text-xs text-[#121212]/65">
                      Trusted private chauffeur to OR Tambo or Lanseria · R450 per trip
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

                {/* "Welcome Home" Refresh Checkbox */}
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
                        “Welcome Home” Refresh
                      </span>
                      <span className="block text-xs text-[#121212]/65">
                        Fresh bread, milk, pantry staples, crisp linens &amp; fresh flower
                        arrangements waiting for you
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
                        Pre-Arrival Power Wash &amp; Minor Maintenance
                      </span>
                      <span className="block text-xs text-[#121212]/65">
                        Patio &amp; driveway power wash, window detailing, gutters &amp; basic
                        handyman checks
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[#8A6A2B] tabular-nums whitespace-nowrap">
                      + R850
                    </span>
                  </div>
                </label>

                {/* Trusted Chauffeur / Errands & Pets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label
                      htmlFor="pet-count"
                      className="block text-xs font-semibold tracking-wide text-[#121212]/80 mb-1.5"
                    >
                      Pets in Residence
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
                      Chauffeur / Errands (R250/hr)
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
                      Est. Chauffeur km (R8/km)
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

            {/* 03. Curated Day Trips & Vetted Family Staff (Quoted on Request) */}
            <div className="pt-6 border-t border-[#121212]/10">
              <h3 className="font-display text-2xl font-medium text-[#121212] mb-1">
                03. Curated Day Trips &amp; On-Request Home Staff
              </h3>
              <p className="text-xs sm:text-sm text-[#121212]/65 mb-4">
                Select any family tours or supervised specialist services to include in your free
                consultation discussion (quoted per itinerary or scope).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <MultiSelectDropdown
                  id="curated-day-trips-dropdown"
                  label="Curated Kids & Family Day Trips"
                  placeholder="Select curated day trips (optional)"
                  options={CURATED_DAY_TRIPS}
                  selectedValues={quoteInput.selectedDayTrips}
                  onToggleValue={(trip) => toggleArrayField('selectedDayTrips', trip)}
                  onClearAll={() => updateField('selectedDayTrips', [])}
                />

                <MultiSelectDropdown
                  id="specialist-services-dropdown"
                  label="Vetted Family Staff & Specialist Services (Quoted on Request)"
                  placeholder="Select specialist services (optional)"
                  options={SPECIALIST_ON_REQUEST_SERVICES}
                  selectedValues={quoteInput.requestedSpecialistServices}
                  onToggleValue={(item) => toggleArrayField('requestedSpecialistServices', item)}
                  onClearAll={() => updateField('requestedSpecialistServices', [])}
                />
              </div>
            </div>

            {/* 04. Free Vetting Consultation & Contact Details */}
            <div className="pt-6 border-t border-[#121212]/10 space-y-5">
              <div>
                <h3 className="font-display text-2xl font-medium text-[#121212] mb-1">
                  04. Free Vetting Consultation &amp; Contact Details
                </h3>
                <p className="text-xs sm:text-sm text-[#121212]/65 mb-4">
                  All new clients meet our family first, including a mandatory pet introduction
                  session, before any dates are locked or invoiced.
                </p>

                <div
                  role="radiogroup"
                  aria-label="Preferred consultation format"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5"
                >
                  {(
                    [
                      {
                        id: 'in-home-meet-greet' as ConsultationPreference,
                        title: 'In-Home Meet & Greet',
                        desc: 'Free Pretoria East home visit + mandatory pet introduction',
                        icon: Handshake,
                      },
                      {
                        id: 'online-video' as ConsultationPreference,
                        title: 'Online Video Call First',
                        desc: '15-min Zoom / WhatsApp video intro + virtual home tour',
                        icon: Video,
                      },
                    ] as const
                  ).map((opt) => {
                    const Icon = opt.icon;
                    const active = quoteInput.consultationPreference === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => updateField('consultationPreference', opt.id)}
                        className={`text-left p-3.5 rounded-sm border transition-colors cursor-pointer flex items-start gap-3 ${
                          active
                            ? 'bg-[#121212] text-[#FAF9F6] border-[#C5A059]'
                            : 'bg-[#FAF9F6] text-[#121212] border-[#121212]/15 hover:border-[#C5A059]'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            active ? 'text-[#C5A059]' : 'text-[#8A6A2B]'
                          }`}
                          aria-hidden="true"
                        />
                        <div>
                          <span className="block text-xs sm:text-sm font-semibold">
                            {opt.title}
                          </span>
                          <span
                            className={`block text-[11px] mt-0.5 ${
                              active ? 'text-[#FAF9F6]/70' : 'text-[#121212]/65'
                            }`}
                          >
                            {opt.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

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
                    htmlFor="residence-suburb"
                    className="block text-xs font-semibold tracking-wide text-[#121212]/80 mb-1.5"
                  >
                    Pretoria East Suburb *
                  </label>
                  <select
                    id="residence-suburb"
                    value={contact.suburbOrResidence}
                    onChange={(e) =>
                      setContact({ ...contact, suburbOrResidence: e.target.value })
                    }
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
                  <span>Before submitting your consultation request:</span>
                </div>
                <ul className="list-disc pl-5 text-xs sm:text-sm space-y-0.5">
                  {formErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </form>

          {/* Right Column: Live Itemized Quote & Pro-Forma Estimate Card (Print-Ready) */}
          <aside className="print-invoice-surface lg:col-span-5 bg-[#121212] text-[#FAF9F6] rounded-sm p-6 sm:p-8 border border-[#C5A059]/30 lg:sticky lg:top-24">
            <div className="pb-5 border-b border-white/15 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck
                    className="print-gold-accent w-4 h-4 text-[#C5A059]"
                    aria-hidden="true"
                  />
                  <span className="print-gold-accent text-xs font-medium tracking-[0.12em] uppercase text-[#C5A059]">
                    Pro-Forma Estimate · {BRAND_NAME}
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-medium text-[#FAF9F6]">
                  Itemized ZAR Quote
                </h3>
                <p className="text-xs text-[#FAF9F6]/65 mt-1">
                  {quoteInput.checkInDate} → {quoteInput.checkOutDate} · {breakdown.totalDays}{' '}
                  {breakdown.totalDays === 1 ? 'day' : 'days'} ·{' '}
                  {quoteInput.stayContext === 'away-travel' ? 'Away Travel' : 'At-Home Support'}
                </p>
              </div>
              <div className="text-right font-mono text-[11px] text-[#FAF9F6]/60 tabular-nums shrink-0">
                <div>Issued {proFormaDate}</div>
                <div>Pretoria East</div>
              </div>
            </div>

            {(contact.fullName || contact.suburbOrResidence) && (
              <div className="py-3 border-b border-white/10 text-xs text-[#FAF9F6]/75 flex flex-wrap justify-between gap-2">
                <span>
                  Prepared for:{' '}
                  <strong className="text-[#FAF9F6]">
                    {contact.fullName || 'Prospective Residence Client'}
                  </strong>
                </span>
                <span>{contact.suburbOrResidence}</span>
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
                    <dt className="text-[#FAF9F6]">“Welcome Home” Refresh</dt>
                    <dd className="text-xs text-[#FAF9F6]/60">
                      Bread, milk, pantry staples, fresh linen &amp; flower arrangements
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
                      Pre-Arrival Power Wash &amp; Minor Maintenance
                    </dt>
                    <dd className="text-xs text-[#FAF9F6]/60">
                      Patio wash, window detailing &amp; basic checks
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
                    <dt className="text-[#FAF9F6]">Trusted Chauffeur &amp; Errands</dt>
                    <dd className="text-xs text-[#FAF9F6]/60">
                      {quoteInput.errandHours} hr @ R250 + {quoteInput.errandKilometers} km @ R8
                    </dd>
                  </div>
                  <dd className="font-medium text-[#FAF9F6]">
                    {formatZar(breakdown.conciergeDrivingSubtotal)}
                  </dd>
                </div>
              )}

              {quoteInput.selectedDayTrips.length > 0 && (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <dt className="text-[#FAF9F6]">Curated Day Trips &amp; Outings</dt>
                    <dd className="text-xs text-[#FAF9F6]/60">
                      {quoteInput.selectedDayTrips.length} × R1,200 ·{' '}
                      {quoteInput.selectedDayTrips.join(', ')}
                    </dd>
                  </div>
                  <dd className="font-medium text-[#FAF9F6] whitespace-nowrap">
                    {formatZar(breakdown.dayTripSubtotal)}
                  </dd>
                </div>
              )}

              {quoteInput.requestedSpecialistServices.length > 0 && (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <dt className="text-[#FAF9F6]">Vetted Family Staff &amp; Specialist Care</dt>
                    <dd className="text-xs text-[#FAF9F6]/60">
                      {quoteInput.requestedSpecialistServices.join(', ')}
                    </dd>
                  </div>
                  <dd className="font-medium text-[#C5A059] whitespace-nowrap">On Request</dd>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[#FAF9F6]/85">
                <dt>Subtotal (Before Festive Surcharge)</dt>
                <dd className="font-medium">{formatZar(breakdown.subtotalBeforePeak)}</dd>
              </div>

              {breakdown.peakSurchargeSubtotal > 0 && (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <dt className="print-gold-accent text-[#C5A059] font-medium">
                      Peak Festive Surcharge (+25%)
                    </dt>
                    <dd className="text-xs text-[#FAF9F6]/60">
                      Dec 20 to Jan 2 ({breakdown.peakFestiveDays} festive{' '}
                      {breakdown.peakFestiveDays === 1 ? 'day' : 'days'})
                    </dd>
                  </div>
                  <dd className="print-gold-accent font-semibold text-[#C5A059]">
                    +{formatZar(breakdown.peakSurchargeSubtotal)}
                  </dd>
                </div>
              )}
            </dl>

            {/* Estimated Total & Vetting Policy Note */}
            <div className="pt-5 border-t border-white/15 space-y-2.5 tabular-nums">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-[#FAF9F6]/80">
                  Estimated Total
                </span>
                <span className="font-display text-3xl sm:text-4xl font-semibold text-[#FAF9F6]">
                  {formatZar(breakdown.estimatedTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-white/10">
                <span className="print-gold-accent text-[#C5A059]">
                  Indicative 50% Deposit (After Vetting)
                </span>
                <span className="print-gold-accent font-semibold text-[#C5A059]">
                  {formatZar(breakdown.indicativeDepositAmount)}
                </span>
              </div>

              <p className="text-[11px] text-[#FAF9F6]/65 leading-relaxed pt-1">
                Free Vetting Policy: R0 due today. All new reservations include a free online or
                in-home meet-and-greet with a mandatory pet introduction before any deposit is
                invoiced.
              </p>
            </div>

            {/* Action Buttons (hidden in PDF print) */}
            <div className="no-print mt-6 pt-5 border-t border-white/10 space-y-3">
              <button
                type="button"
                onClick={validateAndRequestConsultation}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-[#C5A059] hover:bg-[#D4B26E] disabled:opacity-60 text-[#121212] font-semibold text-sm px-5 py-3 rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF9F6]"
              >
                <Handshake className="w-4 h-4 stroke-[2]" aria-hidden="true" />
                <span>
                  {isSubmitting
                    ? 'Preparing Consultation & WhatsApp Summary…'
                    : 'Request Free In-Person or Online Consultation'}
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

      {/* Consultation Confirmation Modal */}
      <BookingConfirmationModal
        result={modalResult}
        onClose={() => setModalResult(null)}
      />
    </section>
  );
}
