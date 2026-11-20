import { BRAND_NAME, WHATSAPP_BASE_URL } from '../data/services';
import {
  ClientContactDetails,
  IncidentalExpenseItem,
  PortalDailyUpdate,
  QuoteBreakdown,
  QuoteInput,
  ResidenceOnboardingDossier,
} from '../types/concierge';
import { apiRequest } from './httpApi';

export interface QuotePayload {
  referenceCode: string;
  quoteInput: QuoteInput;
  breakdown: QuoteBreakdown;
  contact: ClientContactDetails;
  portalUrl?: string;
}

export interface PaystackInvoiceResponse {
  provider: 'paystack';
  requestCode: string;
  amountZar: number;
  amountKoboOrCents: number;
  currency: 'ZAR';
  expiresAtIso: string;
  emailSent: boolean;
}

export interface WhatsAppSummaryResponse {
  whatsappHandoffUrl: string;
  previewText: string;
}

export interface ConsultationRequestResult {
  referenceCode: string;
  submittedAtIso: string;
  consultationPreferenceLabel: string;
  whatsapp: WhatsAppSummaryResponse;
  portalToken: string;
  portalUrl: string;
  contact: ClientContactDetails;
  quoteInput: QuoteInput;
  breakdown: QuoteBreakdown;
}

export interface SupabaseOnboardingSaveResponse {
  saved: boolean;
  dossierId: string;
  savedAtIso: string;
  targetTable: 'onboarding_dossiers';
}

function formatCurrencyZar(amount: number): string {
  return `R${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export async function createPaystackDepositInvoice(
  referenceCode: string,
  teamAccessToken: string
): Promise<PaystackInvoiceResponse> {
  return apiRequest('/api/paystack/invoice', {
    body: JSON.stringify({ quoteRef: referenceCode, paymentType: 'deposit_50' }),
    teamAccessToken,
  });
}

export async function createPaystackFinalInvoice(
  referenceCode: string,
  teamAccessToken: string
): Promise<PaystackInvoiceResponse> {
  return apiRequest('/api/paystack/invoice', {
    body: JSON.stringify({ quoteRef: referenceCode, paymentType: 'final_settlement' }),
    teamAccessToken,
  });
}

export interface ConsultationApiResponse {
  referenceCode: string;
  submittedAtIso: string;
  consultationPreferenceLabel: string;
  contact: ClientContactDetails;
  quoteInput: QuoteInput;
  breakdown: QuoteBreakdown;
  portalToken: string;
  stay: {
    id: string;
    quoteRef: string;
    status: string;
  };
}

export async function createConsultationRequest(
  quoteInput: QuoteInput,
  contact: ClientContactDetails
): Promise<ConsultationApiResponse> {
  return apiRequest('/api/consultations', {
    body: JSON.stringify({ quoteInput, contact }),
  });
}

export function sendWhatsAppQuoteSummary(
  quoteData: QuotePayload
): WhatsAppSummaryResponse {
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
    `QUOTE_REF: #${referenceCode}`,
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
    ...(quoteData.portalUrl ? [`Private Client Portal: ${quoteData.portalUrl}`] : []),
  ].join('\n');

  const whatsappHandoffUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(previewText)}`;

  return {
    whatsappHandoffUrl,
    previewText,
  };
}

export async function saveResidenceOnboardingDossier(
  dossier: ResidenceOnboardingDossier,
  referenceCode: string,
  portalToken?: string,
  teamAccessToken?: string
): Promise<SupabaseOnboardingSaveResponse> {
  return apiRequest(`/api/portal/${encodeURIComponent(referenceCode)}/onboarding`, {
    body: JSON.stringify(dossier),
    portalToken,
    teamAccessToken,
  });
}

export async function publishStayDailyUpdate(
  referenceCode: string,
  update: PortalDailyUpdate,
  teamAccessToken: string,
  photoFile?: File
): Promise<{ update: PortalDailyUpdate }> {
  const body = new FormData();
  body.set('slotTitle', update.slotTitle);
  body.set('guardianName', update.guardianName);
  body.set('statuses', JSON.stringify(update.statuses));
  body.set('notes', update.caretakerNotes);
  if (photoFile) body.set('photo', photoFile);
  return apiRequest(`/api/portal/${encodeURIComponent(referenceCode)}/updates`, {
    body,
    teamAccessToken,
  });
}

export async function logStayIncidentalExpense(
  referenceCode: string,
  expense: IncidentalExpenseItem,
  teamAccessToken: string
): Promise<{ expense: IncidentalExpenseItem }> {
  return apiRequest(`/api/portal/${encodeURIComponent(referenceCode)}/incidentals`, {
    body: JSON.stringify({
      description: expense.description,
      amountZar: expense.amountZar,
      loggedBy: expense.loggedBy,
    }),
    teamAccessToken,
  });
}

export interface UrgentAssistancePayload {
  residenceAddress: string;
  primaryContactName: string;
  primaryContactPhone: string;
  secondaryContactName: string;
  secondaryContactPhone: string;
  urgentReason: string;
}

export interface UrgentAssistanceResponse {
  prepared: boolean;
  alertId: string;
  preparedAtIso: string;
  intendedRecipients: string[];
  whatsappEscalationUrl: string;
}

export async function triggerUrgentAssistanceAlert(
  payload: UrgentAssistancePayload
): Promise<UrgentAssistanceResponse> {
  const alertId = `URG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const intendedRecipients = [
    `${payload.primaryContactName} (${payload.primaryContactPhone})`,
    ...(payload.secondaryContactName.trim() && payload.secondaryContactPhone.trim()
      ? [`${payload.secondaryContactName} (${payload.secondaryContactPhone})`]
      : []),
  ];

  const escalationText = [
    `URGENT ASSISTANCE ALERT (${alertId})`,
    `Residence: ${payload.residenceAddress}`,
    `Primary Contact: ${payload.primaryContactName} (${payload.primaryContactPhone})`,
    payload.secondaryContactName
      ? `Secondary Contact: ${payload.secondaryContactName} (${payload.secondaryContactPhone})`
      : '',
    `Note: ${payload.urgentReason || 'Immediate assistance or callback requested.'}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    prepared: true,
    alertId,
    preparedAtIso: new Date().toISOString(),
    intendedRecipients,
    whatsappEscalationUrl: `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(escalationText)}`,
  };
}
