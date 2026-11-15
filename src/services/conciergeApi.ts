import { PRICING_RATES, SAMPLE_PORTAL_SESSION, WHATSAPP_BASE_URL } from '../data/services';
import {
  ClientContactDetails,
  EstatePortalSession,
  QuoteBreakdown,
  QuoteInput,
} from '../types/concierge';
import {
  createPaystackDepositLink,
  LockBookingExecutionResult,
  sendWhatsAppQuoteSummary,
  syncBookingToGoogleCalendar,
} from './apiPlaceholders';

/**
 * Checks if a given calendar date falls within the Peak Festive window:
 * December 20 through January 2 (inclusive).
 */
export function isPeakFestiveNight(date: Date): boolean {
  const month = date.getMonth(); // 0-indexed: 11 = Dec, 0 = Jan
  const day = date.getDate();
  return (month === 11 && day >= 20) || (month === 0 && day <= 2);
}

export function formatZar(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace('ZAR', 'R')
    .replace(/\s+/g, '');
}

export function calculateQuoteBreakdown(input: QuoteInput): QuoteBreakdown {
  const start = new Date(`${input.checkInDate}T00:00:00`);
  const end = new Date(`${input.checkOutDate}T00:00:00`);

  let standardDays = 0;
  let peakFestiveDays = 0;

  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
    const cursor = new Date(start);
    let safety = 0;
    while (cursor < end && safety < 180) {
      if (isPeakFestiveNight(cursor)) {
        peakFestiveDays += 1;
      } else {
        standardDays += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
      safety += 1;
    }
  }

  const totalDays = standardDays + peakFestiveDays;
  const dailyRateZar =
    input.baseTier === 'vip-24-7'
      ? PRICING_RATES.vipDailyRateZar
      : PRICING_RATES.dailyDropInRateZar;
  const baseTierLabel =
    input.baseTier === 'vip-24-7'
      ? '24/7 VIP Estate & Pet Care'
      : 'Daily Drop-In Visits';

  const baseCareSubtotal = totalDays * dailyRateZar;
  const peakSurchargeSubtotal =
    peakFestiveDays * dailyRateZar * PRICING_RATES.peakFestiveSurchargeRate;

  const airportTransferSubtotal =
    Math.max(0, input.airportTrips) * PRICING_RATES.airportTransferTripZar;
  const welcomeResetSubtotal = input.includeWelcomeReset
    ? PRICING_RATES.welcomeHomeResetFlatZar
    : 0;
  const preArrivalMaintenanceSubtotal = input.includePreArrivalMaintenance
    ? PRICING_RATES.preArrivalMaintenanceFlatZar
    : 0;
  const conciergeDrivingSubtotal =
    Math.max(0, input.errandHours) * PRICING_RATES.conciergeDrivingHourlyZar +
    Math.max(0, input.errandKilometers) * PRICING_RATES.conciergeDrivingPerKmZar;

  const subtotalBeforePeak =
    baseCareSubtotal +
    airportTransferSubtotal +
    welcomeResetSubtotal +
    preArrivalMaintenanceSubtotal +
    conciergeDrivingSubtotal;

  const estimatedTotal = subtotalBeforePeak + peakSurchargeSubtotal;
  const depositAmount = estimatedTotal * PRICING_RATES.depositPercentage;
  const balanceOnArrival = estimatedTotal - depositAmount;

  return {
    baseTier: input.baseTier,
    baseTierLabel,
    dailyRateZar,
    totalDays,
    standardDays,
    peakFestiveDays,
    baseCareSubtotal,
    peakSurchargeSubtotal,
    airportTransferSubtotal,
    welcomeResetSubtotal,
    preArrivalMaintenanceSubtotal,
    conciergeDrivingSubtotal,
    subtotalBeforePeak,
    estimatedTotal,
    depositAmount,
    balanceOnArrival,
    hasFestiveDates: peakFestiveDays > 0,
  };
}

export function buildWhatsAppUrl(message?: string): string {
  if (!message) {
    return WHATSAPP_BASE_URL;
  }
  return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
}

/**
 * Orchestrates locking dates and executing placeholder API services in parallel:
 * 1. Paystack 50% deposit payment link
 * 2. WhatsApp quote summary handoff
 * 3. Google Calendar dispatch hold
 */
export async function lockDatesAndInitializeDeposit(
  quoteInput: QuoteInput,
  contact: ClientContactDetails,
  breakdown: QuoteBreakdown
): Promise<LockBookingExecutionResult> {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const referenceCode = `MG-${new Date().getFullYear()}-${suffix}`;

  const addOnsSummary: string[] = [];
  if (quoteInput.airportTrips > 0) {
    addOnsSummary.push(`Airport Transfers (${quoteInput.airportTrips} trips)`);
  }
  if (quoteInput.includeWelcomeReset) {
    addOnsSummary.push('Welcome Home Reset');
  }
  if (quoteInput.includePreArrivalMaintenance) {
    addOnsSummary.push('Pre-Arrival Power Wash / Minor Maintenance');
  }

  const quotePayload = {
    referenceCode,
    quoteInput,
    breakdown,
    contact,
  };

  const [paystack, whatsapp, calendar] = await Promise.all([
    createPaystackDepositLink(quotePayload),
    sendWhatsAppQuoteSummary(contact.whatsappPhone, quotePayload),
    syncBookingToGoogleCalendar({
      referenceCode,
      estateName: contact.suburbOrEstate,
      clientName: contact.fullName,
      clientEmail: contact.email,
      checkInDate: quoteInput.checkInDate,
      checkOutDate: quoteInput.checkOutDate,
      serviceTierLabel: breakdown.baseTierLabel,
      addOnsSummary,
    }),
  ]);

  return {
    referenceCode,
    submittedAtIso: new Date().toISOString(),
    paystack,
    whatsapp,
    calendar,
    contact,
    quoteInput,
    breakdown,
  };
}

/**
 * Modular API boundary for Client Portal lookup.
 */
export async function fetchClientPortalSession(
  referenceCode: string,
  email: string
): Promise<{ ok: true; session: EstatePortalSession } | { ok: false; error: string }> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const normalizedRef = referenceCode.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedRef) {
    return { ok: false, error: 'Please enter your estate booking reference (e.g. MG-2026-WKR).' };
  }
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { ok: false, error: 'Please enter the email address registered during onboarding.' };
  }

  if (normalizedRef === SAMPLE_PORTAL_SESSION.referenceCode) {
    return { ok: true, session: SAMPLE_PORTAL_SESSION };
  }

  return {
    ok: false,
    error: `No active guardianship file found for "${normalizedRef}". Use sample code MG-2026-WKR to preview a live estate log, or contact WhatsApp Concierge.`,
  };
}
