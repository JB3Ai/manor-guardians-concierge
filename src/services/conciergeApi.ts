import { WHATSAPP_BASE_URL } from '../data/services';
import {
  ClientContactDetails,
  QuoteInput,
  ResidencePortalData,
} from '../types/concierge';
import {
  ConsultationRequestResult,
  createConsultationRequest,
  sendWhatsAppQuoteSummary,
} from './apiPlaceholders';
import { calculateQuoteBreakdown } from './quoteCalculator';

export { calculateQuoteBreakdown, isPeakFestiveNight } from './quoteCalculator';
import { getClientPortalSession } from './portalApi';

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

export function buildWhatsAppUrl(message?: string): string {
  if (!message) {
    return WHATSAPP_BASE_URL;
  }
  return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
}

/**
 * Persists a free consultation request, then prepares the WhatsApp handoff.
 */
export async function requestFreeConsultation(
  quoteInput: QuoteInput,
  contact: ClientContactDetails
): Promise<ConsultationRequestResult> {
  const saved = await createConsultationRequest(quoteInput, contact);
  const portal = new URL('/portal', window.location.origin);
  portal.searchParams.set('ref', saved.referenceCode);
  portal.searchParams.set('token', saved.portalToken);
  const portalUrl = portal.toString();
  const whatsapp = sendWhatsAppQuoteSummary({
    referenceCode: saved.referenceCode,
    quoteInput: saved.quoteInput,
    breakdown: saved.breakdown,
    contact: saved.contact,
    portalUrl,
  });

  return {
    referenceCode: saved.referenceCode,
    submittedAtIso: saved.submittedAtIso,
    consultationPreferenceLabel: saved.consultationPreferenceLabel,
    whatsapp,
    portalToken: saved.portalToken,
    portalUrl,
    contact: saved.contact,
    quoteInput: saved.quoteInput,
    breakdown: saved.breakdown,
  };
}

export async function fetchClientPortalSession(
  referenceCode: string,
  portalToken?: string,
  teamAccessToken?: string
): Promise<ResidencePortalData> {
  if (!referenceCode.trim()) {
    throw new Error('Please enter your residence booking reference.');
  }
  if (!portalToken && !teamAccessToken) {
    throw new Error('Open your private client portal link or sign in as a team administrator.');
  }
  return getClientPortalSession(referenceCode.trim(), portalToken, teamAccessToken);
}
