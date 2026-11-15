import { BRAND_NAME, WHATSAPP_BASE_URL } from '../data/services';
import {
  ClientContactDetails,
  IncidentalExpenseItem,
  PortalDailyUpdate,
  QuoteBreakdown,
  QuoteInput,
  ResidenceOnboardingDossier,
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
  residenceName: string;
  clientName: string;
  clientEmail: string;
  checkInDate: string;
  checkOutDate: string;
  serviceTierLabel: string;
  consultationPreferenceLabel: string;
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

export interface ConsultationRequestResult {
  referenceCode: string;
  submittedAtIso: string;
  consultationPreferenceLabel: string;
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
  targetTable: 'residence_onboarding_dossiers';
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
 * Placeholder API: Generates a Paystack checkout link in ZAR once a stay is vetted and confirmed.
 */
export async function createPaystackDepositLink(
  quoteData: QuotePayload
): Promise<PaystackDepositLinkResponse> {
  await new Promise((resolve) => setTimeout(resolve, 180));

  const amountZar = quoteData.breakdown.indicativeDepositAmount;
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
 * Placeholder API: Generates a Paystack settlement link for the final stay invoice (remaining 50% + incidentals).
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
 * Placeholder API: Dispatches an itemized WhatsApp quote & free consultation request summary.
 */
export async function sendWhatsAppQuoteSummary(
  phone: string,
  quoteData: QuotePayload
): Promise<WhatsAppSummaryResponse> {
  await new Promise((resolve) => setTimeout(resolve, 160));

  const { referenceCode, quoteInput, breakdown, contact } = quoteData;

  const consultLabel =
    quoteInput.consultationPreference === 'in-home-meet-greet'
      ? 'In-Home Meet & Greet (incl. Pet Introduction)'
      : 'Online Video Consultation';

  const contextLabel =
    quoteInput.stayContext === 'away-travel'
      ? 'Traveling Away from Home'
      : 'At-Home Support (Offloading Chores & Errands)';

  const addOns: string[] = [];
  if (quoteInput.airportTrips > 0) {
    addOns.push(`Airport Transfers (${quoteInput.airportTrips} trip(s))`);
  }
  if (quoteInput.includeWelcomeReset) {
    addOns.push('Welcome Home Refresh (R600)');
  }
  if (quoteInput.includePreArrivalMaintenance) {
    addOns.push('Pre-Arrival Power Wash / Maintenance (R850)');
  }
  if (breakdown.conciergeDrivingSubtotal > 0) {
    addOns.push(
      `Trusted Chauffeur / Errands (${quoteInput.errandHours}h / ${quoteInput.errandKilometers}km)`
    );
  }
  if (quoteInput.selectedDayTrips.length > 0) {
    addOns.push(`Curated Day Trips: ${quoteInput.selectedDayTrips.join(', ')}`);
  }
  if (quoteInput.requestedSpecialistServices.length > 0) {
    addOns.push(
      `On-Request Specialist Services: ${quoteInput.requestedSpecialistServices.join(', ')}`
    );
  }

  const previewText = [
    `Hello ${BRAND_NAME},`,
    `I would like to book a Free Vetting Consultation (${referenceCode}).`,
    `Consultation Preference: ${consultLabel}`,
    `Name: ${contact.fullName} (${contact.suburbOrResidence})`,
    `Support Context: ${contextLabel}`,
    `Service Tier: ${breakdown.baseTierLabel}`,
    `Dates: ${quoteInput.checkInDate} to ${quoteInput.checkOutDate} (${breakdown.totalDays} days${breakdown.peakFestiveDays > 0 ? `, incl. ${breakdown.peakFestiveDays} Peak Festive days` : ''})`,
    `Pets: ${quoteInput.petCount} (${quoteInput.petSpeciesSummary || 'Standard care'})`,
    `Selected Add-Ons: ${addOns.length > 0 ? addOns.join(' | ') : 'None'}`,
    `Estimated ZAR Quote: ${formatCurrencyZar(breakdown.estimatedTotal)}${breakdown.hasCustomQuotedItems ? ' (+ On-Request Items)' : ''}`,
    `Note: Ready to schedule our free meet-and-greet & pet introduction before locking dates.`,
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
 * Placeholder API: Logs a tentative consultation & stay window hold on Google Calendar.
 */
export async function syncBookingToGoogleCalendar(
  bookingData: BookingCalendarPayload
): Promise<GoogleCalendarSyncResponse> {
  await new Promise((resolve) => setTimeout(resolve, 160));

  const eventId = `gcal_${bookingData.referenceCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  return {
    synced: true,
    eventId,
    calendarName: 'Pretoria East Family Concierge Calendar',
    summary: `[FREE CONSULTATION · ${bookingData.consultationPreferenceLabel}] ${bookingData.clientName} · ${bookingData.residenceName} (${bookingData.referenceCode})`,
    startIso: `${bookingData.checkInDate}T09:00:00+02:00`,
    endIso: `${bookingData.checkOutDate}T16:00:00+02:00`,
  };
}

/**
 * Placeholder API (Supabase-ready): Persists client Residence & Pet Onboarding Dossier.
 */
export async function saveResidenceOnboardingDossier(
  dossier: ResidenceOnboardingDossier
): Promise<SupabaseOnboardingSaveResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const savedAtIso = new Date().toISOString();
  const dossierId =
    dossier.dossierId || `DOS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  return {
    saved: true,
    dossierId,
    savedAtIso,
    targetTable: 'residence_onboarding_dossiers',
  };
}

/**
 * Placeholder API (Supabase-ready): Publishes a new daily timed update from Team Admin View.
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
