import { randomInt } from 'node:crypto';
import { Request, Response, Router } from 'express';
import { ClientContactDetails, QuoteInput } from '../src/types/concierge';
import { calculateQuoteBreakdown } from '../src/services/quoteCalculator';
import { createPortalToken, hashPortalToken } from './auth';
import { asyncRoute, HttpError } from './http';
import { getSupabaseAdmin } from './supabase';

const router = Router();
const consultationRateWindows = new Map<string, { count: number; resetsAt: number }>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 10;

function consultationRateLimit(request: Request, response: Response, next: () => void): void {
  const now = Date.now();
  const key = request.ip || request.socket.remoteAddress || 'unknown';
  const current = consultationRateWindows.get(key);
  if (!current || current.resetsAt <= now) {
    consultationRateWindows.set(key, { count: 1, resetsAt: now + RATE_WINDOW_MS });
  } else if (current.count >= RATE_LIMIT) {
    response.status(429).json({ error: 'Too many consultation requests. Please try again later.' });
    return;
  } else {
    current.count += 1;
  }
  if (consultationRateWindows.size > 10_000) {
    for (const [ip, window] of consultationRateWindows) {
      if (window.resetsAt <= now) consultationRateWindows.delete(ip);
    }
  }
  next();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(
  value: unknown,
  field: string,
  maxLength: number,
  minimumLength = 1
): string {
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} is required.`);
  }
  const normalized = value.trim();
  if (normalized.length < minimumLength || normalized.length > maxLength) {
    throw new HttpError(400, `${field} must be between ${minimumLength} and ${maxLength} characters.`);
  }
  return normalized;
}

function boundedNumber(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
  integer = false
): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum ||
    (integer && !Number.isInteger(value))
  ) {
    throw new HttpError(400, `${field} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

function parseQuoteInput(value: unknown): QuoteInput {
  if (!isRecord(value)) throw new HttpError(400, 'A quote input is required.');

  const checkInDate = requiredString(value.checkInDate, 'Check-in date', 10);
  const checkOutDate = requiredString(value.checkOutDate, 'Check-out date', 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(checkInDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(checkOutDate)
  ) {
    throw new HttpError(400, 'Stay dates must use YYYY-MM-DD format.');
  }
  const start = Date.parse(`${checkInDate}T00:00:00Z`);
  const end = Date.parse(`${checkOutDate}T00:00:00Z`);
  const durationDays = (end - start) / 86_400_000;
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    new Date(start).toISOString().slice(0, 10) !== checkInDate ||
    new Date(end).toISOString().slice(0, 10) !== checkOutDate ||
    durationDays < 1 ||
    durationDays > 180
  ) {
    throw new HttpError(400, 'The stay must be between 1 and 180 nights.');
  }

  if (value.baseTier !== 'vip-24-7' && value.baseTier !== 'daily-drop-in') {
    throw new HttpError(400, 'Choose a valid care service tier.');
  }
  if (value.stayContext !== 'away-travel' && value.stayContext !== 'at-home-support') {
    throw new HttpError(400, 'Choose a valid stay context.');
  }
  if (
    value.consultationPreference !== 'in-home-meet-greet' &&
    value.consultationPreference !== 'online-video'
  ) {
    throw new HttpError(400, 'Choose a valid consultation format.');
  }
  if (!Array.isArray(value.selectedDayTrips) || value.selectedDayTrips.length > 10) {
    throw new HttpError(400, 'Select no more than 10 day trips.');
  }
  if (!Array.isArray(value.requestedSpecialistServices) || value.requestedSpecialistServices.length > 10) {
    throw new HttpError(400, 'Select no more than 10 specialist services.');
  }
  if (
    typeof value.includeWelcomeReset !== 'boolean' ||
    typeof value.includePreArrivalMaintenance !== 'boolean'
  ) {
    throw new HttpError(400, 'Choose valid consultation add-on options.');
  }
  if (
    value.petSpeciesSummary !== undefined &&
    typeof value.petSpeciesSummary !== 'string'
  ) {
    throw new HttpError(400, 'Pet summary must be text.');
  }
  if (value.maintenanceNotes !== undefined && typeof value.maintenanceNotes !== 'string') {
    throw new HttpError(400, 'Maintenance notes must be text.');
  }

  return {
    stayContext: value.stayContext,
    baseTier: value.baseTier,
    checkInDate,
    checkOutDate,
    petCount: boundedNumber(value.petCount, 'Pet count', 1, 20, true),
    petSpeciesSummary: typeof value.petSpeciesSummary === 'string'
      ? value.petSpeciesSummary.trim().slice(0, 250)
      : '',
    airportTrips: boundedNumber(value.airportTrips, 'Airport trips', 0, 20, true),
    includeWelcomeReset: value.includeWelcomeReset === true,
    includePreArrivalMaintenance: value.includePreArrivalMaintenance === true,
    errandHours: boundedNumber(value.errandHours, 'Errand hours', 0, 500),
    errandKilometers: boundedNumber(value.errandKilometers, 'Errand kilometers', 0, 10_000),
    selectedDayTrips: value.selectedDayTrips.map((trip) =>
      requiredString(trip, 'Day trip', 120)
    ),
    requestedSpecialistServices: value.requestedSpecialistServices.map((service) =>
      requiredString(service, 'Specialist service', 180)
    ),
    consultationPreference: value.consultationPreference,
    maintenanceNotes: typeof value.maintenanceNotes === 'string'
      ? value.maintenanceNotes.trim().slice(0, 2000)
      : '',
  };
}

function normalizeWhatsAppNumber(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) digits = `27${digits.slice(1)}`;
  if (digits.length < 9 || digits.length > 15) {
    throw new HttpError(400, 'Enter a valid WhatsApp number including its country code.');
  }
  return digits;
}

function parseContact(value: unknown): ClientContactDetails {
  if (!isRecord(value)) throw new HttpError(400, 'Contact details are required.');

  const email = requiredString(value.email, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'Enter a valid email address.');
  }
  return {
    fullName: requiredString(value.fullName, 'Full name', 160, 2),
    suburbOrResidence: requiredString(value.suburbOrResidence, 'Suburb or residence', 180),
    whatsappPhone: normalizeWhatsAppNumber(
      requiredString(value.whatsappPhone, 'WhatsApp number', 40)
    ),
    email,
    specialInstructions:
      typeof value.specialInstructions === 'string'
        ? value.specialInstructions.trim().slice(0, 2000)
        : '',
  };
}

router.post(
  '/',
  consultationRateLimit,
  asyncRoute(async (request: Request, response: Response) => {
    if (!isRecord(request.body)) throw new HttpError(400, 'A JSON request body is required.');
    const quoteInput = parseQuoteInput(request.body.quoteInput);
    const contact = parseContact(request.body.contact);
    const breakdown = calculateQuoteBreakdown(quoteInput);
    if (breakdown.totalDays < 1) throw new HttpError(400, 'The selected stay dates are invalid.');

    const supabase = getSupabaseAdmin();
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .upsert(
        {
          full_name: contact.fullName,
          email: contact.email,
          whatsapp_number: contact.whatsappPhone,
          suburb: contact.suburbOrResidence,
          estate_address: contact.suburbOrResidence,
        },
        { onConflict: 'whatsapp_number' }
      )
      .select('id')
      .single();
    if (clientError || !client) {
      console.error('Client upsert failed:', clientError?.message);
      throw new HttpError(502, 'We could not save your consultation contact details. Please try again.');
    }

    const portalToken = createPortalToken();
    const notes = JSON.stringify({
      stayContext: quoteInput.stayContext,
      petCount: quoteInput.petCount,
      petSpeciesSummary: quoteInput.petSpeciesSummary,
      errandHours: quoteInput.errandHours,
      errandKilometers: quoteInput.errandKilometers,
      selectedDayTrips: quoteInput.selectedDayTrips,
      requestedSpecialistServices: quoteInput.requestedSpecialistServices,
      maintenanceNotes: quoteInput.maintenanceNotes,
      specialInstructions: contact.specialInstructions,
    });

    let stay:
      | { id: string; quote_ref: string; status: string; created_at: string }
      | null = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const quoteRef = `PE-${new Date().getFullYear()}-${randomInt(1000, 10_000)}`;
      const { data, error } = await supabase
        .from('stays')
        .insert({
          quote_ref: quoteRef,
          client_id: client.id,
          service_tier: quoteInput.baseTier === 'vip-24-7' ? 'care_247' : 'care_checkin',
          start_date: quoteInput.checkInDate,
          end_date: quoteInput.checkOutDate,
          airport_trips: quoteInput.airportTrips,
          day_trips: quoteInput.selectedDayTrips.length,
          welcome_refresh: quoteInput.includeWelcomeReset,
          custom_notes: notes,
          consult_format:
            quoteInput.consultationPreference === 'in-home-meet-greet'
              ? 'in_home'
              : 'online',
          preferred_consult_time: null,
          subtotal_zar: breakdown.subtotalBeforePeak,
          festive_surcharge_zar: breakdown.peakSurchargeSubtotal,
          total_zar: breakdown.estimatedTotal,
          deposit_zar: breakdown.indicativeDepositAmount,
          status: 'vetting_requested',
          portal_token_hash: hashPortalToken(portalToken),
        })
        .select('id, quote_ref, status, created_at')
        .single();

      if (!error && data) {
        stay = data;
        break;
      }
      if (error?.code === '23505') continue;
      console.error('Stay insert failed:', error?.message);
      throw new HttpError(502, 'We could not save your consultation request. Please try again.');
    }
    if (!stay) {
      throw new HttpError(503, 'We could not generate a unique booking reference. Please try again.');
    }

    response.status(201).json({
      referenceCode: stay.quote_ref,
      submittedAtIso: stay.created_at,
      consultationPreferenceLabel:
        quoteInput.consultationPreference === 'in-home-meet-greet'
          ? 'In-Home Meet & Greet (Includes Pet Introduction)'
          : 'Online Video Call Consultation',
      contact,
      quoteInput,
      breakdown,
      portalToken,
      stay: {
        id: stay.id,
        quoteRef: stay.quote_ref,
        status: stay.status,
      },
    });
  })
);

export default router;
