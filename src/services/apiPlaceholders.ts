import { WHATSAPP_BASE_URL } from '../data/services';
import {
  ClientContactDetails,
  EstateOnboardingDossier,
  IncidentalExpenseItem,
  PortalDailyUpdate,
  QuoteBreakdown,
  QuoteInput,
} from '../types/concierge';

export interface QuotePayload {
  referenceCode: string;
  quoteInput: QuoteInput;
  breakdown: QuoteBreakdown;
  contact: ClientContactDetails;
}

export interface PaystackDepositLinkResponse {
  provider: 'paystack';
  reference: string;
  authorizationUrl: string;
  amountZar: number;
  amountKoboOrCents: number;
  currency: 'ZAR';
  expiresAtIso: string;
}

export interface WhatsAppSummaryResponse {
  dispatched: boolean;
  messageId: string;
  recipientPhone: string;
  whatsappHandoffUrl: string;
  previewText: string;
}

export interface BookingCalendarPayload {
  referenceCode: string;
  estateName: string;
  clientName: string;
  clientEmail: string;
  checkInDate: string;
  checkOutDate: string;
  serviceTierLabel: string;
  addOnsSummary: string[];
}

export interface GoogleCalendarSyncResponse {
  synced: boolean;
  eventId: string;
  calendarName: string;
  summary: string;
  startIso: string;
  endIso: string;
}

export interface LockBookingExecutionResult {
  referenceCode: string;
  submittedAtIso: string;
  paystack: PaystackDepositLinkResponse;
  whatsapp: WhatsAppSummaryResponse;
  calendar: GoogleCalendarSyncResponse;
  contact: ClientContactDetails;
  quoteInput: QuoteInput;
  breakdown: QuoteBreakdown;
}

export interface SupabaseOnboardingSaveResponse {
  saved: boolean;
  dossierId: string;
  savedAtIso: string;
  targetTable: 'estate_onboarding_dossiers';
}

export interface SupabasePortalUpdateResponse {
  saved: boolean;
  updateId: string;
  savedAtIso: string;
}

function formatCurrencyZar(amount: number): string {
  return `R${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Placeholder API: Generates a Paystack checkout link in ZAR (50% deposit or final invoice settlement).
 * Replace with a server-side POST /api/payments/paystack/initialize call in production.
 */
export async function createPaystackDepositLink(
  quoteData: QuotePayload
): Promise<PaystackDepositLinkResponse> {
  await new Promise((resolve) => setTimeout(resolve, 180));

  const amountZar = quoteData.breakdown.depositAmount;
  const amountCents = Math.round(amountZar * 100);
  const paystackRef = `PSK-${quoteData.referenceCode}`;

  return {
    provider: 'paystack',
    reference: paystackRef,
    authorizationUrl: `https://checkout.paystack.com/demo/${encodeURIComponent(paystackRef)}?amount=${amountCents}&currency=ZAR`,
    amountZar,
    amountKoboOrCents: amountCents,
    currency: 'ZAR',
    expiresAtIso: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Placeholder API: Generates a Paystack settlement link for the final invoice (remaining 50% + incidentals).
 */
export async function createPaystackFinalInvoiceLink(
  referenceCode: string,
  amountDueZar: number
): Promise<PaystackDepositLinkResponse> {
  await new Promise((resolve) => setTimeout(resolve, 180));

  const amountCents = Math.round(amountDueZar * 100);
  const paystackRef = `PSK-FINAL-${referenceCode}-${Date.now().toString().slice(-4)}`;

  return {
    provider: 'paystack',
    reference: paystackRef,
    authorizationUrl: `https://checkout.paystack.com/demo/${encodeURIComponent(paystackRef)}?amount=${amountCents}&currency=ZAR`,
    amountZar: amountDueZar,
    amountKoboOrCents: amountCents,
    currency: 'ZAR',
    expiresAtIso: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Placeholder API: Dispatches an itemized WhatsApp quote summary and prepares a direct client handoff link.
 */
export async function sendWhatsAppQuoteSummary(
  phone: string,
  quoteData: QuotePayload
): Promise<WhatsAppSummaryResponse> {
  await new Promise((resolve) => setTimeout(resolve, 160));

  const { referenceCode, quoteInput, breakdown, contact } = quoteData;

  const addOns: string[] = [];
  if (quoteInput.airportTrips > 0) {
    addOns.push(`Airport Transfers (${quoteInput.airportTrips} trip(s))`);
  }
  if (quoteInput.includeWelcomeReset) {
    addOns.push('Welcome Home Reset (R600)');
  }
  if (quoteInput.includePreArrivalMaintenance) {
    addOns.push('Pre-Arrival Power Wash / Minor Maintenance (R850)');
  }
  if (breakdown.conciergeDrivingSubtotal > 0) {
    addOns.push(
      `Concierge Errands (${quoteInput.errandHours}h / ${quoteInput.errandKilometers}km)`
    );
  }

  const previewText = [
    `Hello The Manor Guardians,`,
    `Please confirm availability for Quote Ref: ${referenceCode}.`,
    `Client: ${contact.fullName} (${contact.suburbOrEstate})`,
    `Service Tier: ${breakdown.baseTierLabel}`,
    `Dates: ${quoteInput.checkInDate} to ${quoteInput.checkOutDate} (${breakdown.totalDays} days${breakdown.peakFestiveDays > 0 ? `, incl. ${breakdown.peakFestiveDays} Peak Festive days` : ''})`,
    `Pets: ${quoteInput.petCount} (${quoteInput.petSpeciesSummary || 'Standard care'})`,
    `Add-Ons: ${addOns.length > 0 ? addOns.join(', ') : 'None'}`,
    `Total Quote: ${formatCurrencyZar(breakdown.estimatedTotal)}`,
    `50% Deposit Due to Lock Dates: ${formatCurrencyZar(breakdown.depositAmount)}`,
  ].join('\n');

  const whatsappHandoffUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(previewText)}`;

  return {
    dispatched: true,
    messageId: `wamid.${referenceCode.replace(/[^A-Z0-9]/gi, '').toLowerCase()}${Date.now().toString().slice(-4)}`,
    recipientPhone: phone,
    whatsappHandoffUrl,
    previewText,
  };
}

/**
 * Placeholder API: Creates a tentative estate guardianship hold on the dispatch Google Calendar.
 */
export async function syncBookingToGoogleCalendar(
  bookingData: BookingCalendarPayload
): Promise<GoogleCalendarSyncResponse> {
  await new Promise((resolve) => setTimeout(resolve, 160));

  const eventId = `gcal_${bookingData.referenceCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  return {
    synced: true,
    eventId,
    calendarName: 'Pretoria Senior Guardian Dispatch',
    summary: `[PENDING DEPOSIT] ${bookingData.clientName} · ${bookingData.estateName} (${bookingData.referenceCode})`,
    startIso: `${bookingData.checkInDate}T09:00:00+02:00`,
    endIso: `${bookingData.checkOutDate}T16:00:00+02:00`,
  };
}

/**
 * Placeholder API (Supabase-ready): Persists client Estate & Pet Onboarding Dossier.
 * Replace with `supabase.from('estate_onboarding_dossiers').upsert(...)` in production.
 */
export async function saveEstateOnboardingDossier(
  dossier: EstateOnboardingDossier
): Promise<SupabaseOnboardingSaveResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const savedAtIso = new Date().toISOString();
  const dossierId =
    dossier.dossierId || `DOS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  return {
    saved: true,
    dossierId,
    savedAtIso,
    targetTable: 'estate_onboarding_dossiers',
  };
}

/**
 * Placeholder API (Supabase-ready): Publishes a new daily timed guardian update from Team Admin View.
 * Replace with `supabase.from('stay_daily_updates').insert(...)` in production.
 */
export async function publishStayDailyUpdate(
  update: PortalDailyUpdate
): Promise<SupabasePortalUpdateResponse> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return {
    saved: true,
    updateId: update.id,
    savedAtIso: new Date().toISOString(),
  };
}

/**
 * Placeholder API (Supabase-ready): Logs an out-of-pocket incidental expense to the Stay Ledger.
 */
export async function logStayIncidentalExpense(
  expense: IncidentalExpenseItem
): Promise<{ saved: boolean; expenseId: string }> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return {
    saved: true,
    expenseId: expense.id,
  };
}
