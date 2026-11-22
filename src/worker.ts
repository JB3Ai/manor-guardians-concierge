import { calculateQuoteBreakdown } from './services/quoteCalculator';
import type {
  ClientContactDetails,
  EmergencyContactPerson,
  EmergencyProtocolDetails,
  QuoteInput,
  ResidenceOnboardingDossier,
  ResidencePortalData,
  StayStatusChecks,
} from './types/concierge';

interface D1Result<T> {
  results: T[];
  success: boolean;
  meta: { changes: number };
}

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<{ success: boolean; meta: { changes: number }; error?: string }>;
}

interface D1Database {
  prepare(query: string): D1Statement;
}

interface R2ObjectBody {
  body: ReadableStream<Uint8Array>;
  httpMetadata?: { contentType?: string };
  size: number;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream<Uint8Array>,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
}

interface Env {
  manor_guardians_db: D1Database;
  manor_guardians_media: R2Bucket;
  ASSETS: { fetch(request: Request): Promise<Response> };
  ADMIN_PASSWORD?: string;
  JWT_SECRET?: string;
  PAYSTACK_SECRET_KEY?: string;
  WHATSAPP_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WEBHOOK_VERIFY_TOKEN?: string;
  META_APP_SECRET?: string;
  GOOGLE_CALENDAR_ID?: string;
}

interface StayRow {
  id: string;
  quote_ref: string;
  client_id: string;
  start_date: string;
  end_date: string;
  total_zar: number;
  deposit_zar: number;
  status: string;
  portal_token_hash: string;
  created_at: string;
}

interface ClientRow {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp_number: string;
  suburb: string | null;
  estate_address: string | null;
  paystack_customer_code: string | null;
}

interface PaymentRow {
  id: string;
  stay_id: string;
  payment_type: 'deposit_50' | 'final_settlement';
  amount_zar: number;
  status: 'pending' | 'paid' | 'failed';
}

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const QUOTE_REF_PATTERN = /^PE-\d{4}-\d{4}$/;

function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { status, headers: responseHeaders });
}

function fail(status: number, message: string): never {
  throw new ApiError(status, message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return fail(400, 'The request body must be valid JSON.');
  }
  if (!isRecord(value)) return fail(400, 'A JSON request body is required.');
  return value;
}

function requiredString(
  value: unknown,
  field: string,
  maxLength = 2000,
  minLength = 1
): string {
  if (typeof value !== 'string') return fail(400, `${field} is required.`);
  const normalized = value.trim();
  if (normalized.length < minLength || normalized.length > maxLength) {
    return fail(400, `${field} must be between ${minLength} and ${maxLength} characters.`);
  }
  return normalized;
}

function optionalString(value: unknown, maxLength = 2000): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function boundedNumber(
  value: unknown,
  field: string,
  min: number,
  max: number,
  integer = false
): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  ) {
    return fail(400, `${field} must be between ${min} and ${max}.`);
  }
  return value;
}

function normalizeQuoteRef(value: string): string {
  return value.trim().replace(/^#/, '').toUpperCase();
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(value: string): Uint8Array | null {
  if (!/^(?:[\da-f]{2})+$/i.test(value)) return null;
  const result = new Uint8Array(value.length / 2);
  for (let index = 0; index < result.length; index += 1) {
    result[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return result;
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

async function tokenMatches(token: string, storedHash: string): Promise<boolean> {
  if (!TOKEN_PATTERN.test(token)) return false;
  const expected = fromHex(storedHash);
  return expected !== null && equalBytes(await sha256(token), expected);
}

function base64UrlEncode(value: Uint8Array): string {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const result = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    result[index] = binary.charCodeAt(index);
  }
  return result;
}

async function jwtKey(secret: string, usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usage
  );
}

async function createAdminJwt(env: Env): Promise<{ token: string; expiresAt: number }> {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    return fail(503, 'JWT_SECRET must be configured with at least 32 characters.');
  }
  const expiresAt = Math.floor(Date.now() / 1000) + 8 * 60 * 60;
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = base64UrlEncode(
    encoder.encode(JSON.stringify({ role: 'team_admin', exp: expiresAt }))
  );
  const content = `${header}.${payload}`;
  const key = await jwtKey(env.JWT_SECRET, ['sign']);
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, encoder.encode(content))
  );
  return { token: `${content}.${base64UrlEncode(signature)}`, expiresAt };
}

async function isAdmin(request: Request, env: Env): Promise<boolean> {
  const match = /^Bearer\s+([A-Za-z0-9_.-]+)$/i.exec(request.headers.get('authorization') || '');
  if (!match || !env.JWT_SECRET || env.JWT_SECRET.length < 32) return false;
  try {
    const [headerPart, payloadPart, signaturePart, extra] = match[1].split('.');
    if (!headerPart || !payloadPart || !signaturePart || extra !== undefined) return false;
    const header = JSON.parse(decoder.decode(base64UrlDecode(headerPart))) as Record<string, unknown>;
    const payload = JSON.parse(decoder.decode(base64UrlDecode(payloadPart))) as Record<string, unknown>;
    if (header.alg !== 'HS256' || header.typ !== 'JWT') return false;
    if (payload.role !== 'team_admin' || typeof payload.exp !== 'number' || payload.exp <= Date.now() / 1000) {
      return false;
    }
    const key = await jwtKey(env.JWT_SECRET, ['verify']);
    return crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(signaturePart),
      encoder.encode(`${headerPart}.${payloadPart}`)
    );
  } catch {
    return false;
  }
}

async function authorizeStay(
  request: Request,
  env: Env,
  stay: Pick<StayRow, 'portal_token_hash'>
): Promise<void> {
  if (await isAdmin(request, env)) return;
  const token = request.headers.get('x-portal-token') || '';
  if (!(await tokenMatches(token, stay.portal_token_hash))) {
    return fail(401, 'A valid client portal token or team administrator session is required.');
  }
}

async function authorizeStayId(
  request: Request,
  env: Env,
  stayId: string
): Promise<StayRow> {
  const stay = await env.manor_guardians_db.prepare(
    `SELECT id, quote_ref, client_id, start_date, end_date, total_zar, deposit_zar,
            status, portal_token_hash, created_at
     FROM stays WHERE id = ?`
  )
    .bind(stayId)
    .first<StayRow>();
  if (!stay) return fail(404, 'The residence file was not found.');
  await authorizeStay(request, env, stay);
  return stay;
}

async function requireAdmin(request: Request, env: Env): Promise<void> {
  if (!(await isAdmin(request, env))) {
    return fail(401, 'Sign in as a team administrator to continue.');
  }
}

function validateQuoteInput(value: unknown): QuoteInput {
  if (!isRecord(value)) return fail(400, 'A quote input is required.');
  const checkInDate = requiredString(value.checkInDate, 'Check-in date', 10);
  const checkOutDate = requiredString(value.checkOutDate, 'Check-out date', 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkInDate) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOutDate)) {
    return fail(400, 'Stay dates must use YYYY-MM-DD format.');
  }
  const start = Date.parse(`${checkInDate}T00:00:00Z`);
  const end = Date.parse(`${checkOutDate}T00:00:00Z`);
  const nights = (end - start) / 86_400_000;
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    new Date(start).toISOString().slice(0, 10) !== checkInDate ||
    new Date(end).toISOString().slice(0, 10) !== checkOutDate ||
    nights < 1 ||
    nights > 180
  ) {
    return fail(400, 'The stay must be between 1 and 180 nights.');
  }
  if (value.baseTier !== 'vip-24-7' && value.baseTier !== 'daily-drop-in') {
    return fail(400, 'Choose a valid care service tier.');
  }
  if (value.stayContext !== 'away-travel' && value.stayContext !== 'at-home-support') {
    return fail(400, 'Choose a valid stay context.');
  }
  if (
    value.consultationPreference !== 'in-home-meet-greet' &&
    value.consultationPreference !== 'online-video'
  ) {
    return fail(400, 'Choose a valid consultation format.');
  }
  if (!Array.isArray(value.selectedDayTrips) || value.selectedDayTrips.length > 10) {
    return fail(400, 'Select no more than 10 day trips.');
  }
  if (
    !Array.isArray(value.requestedSpecialistServices) ||
    value.requestedSpecialistServices.length > 10
  ) {
    return fail(400, 'Select no more than 10 specialist services.');
  }
  if (typeof value.includeWelcomeReset !== 'boolean' || typeof value.includePreArrivalMaintenance !== 'boolean') {
    return fail(400, 'Choose valid consultation add-on options.');
  }
  if (value.petSpeciesSummary !== undefined && typeof value.petSpeciesSummary !== 'string') {
    return fail(400, 'Pet summary must be text.');
  }
  if (value.maintenanceNotes !== undefined && typeof value.maintenanceNotes !== 'string') {
    return fail(400, 'Maintenance notes must be text.');
  }
  return {
    stayContext: value.stayContext,
    baseTier: value.baseTier,
    checkInDate,
    checkOutDate,
    petCount: boundedNumber(value.petCount, 'Pet count', 1, 20, true),
    petSpeciesSummary: optionalString(value.petSpeciesSummary, 250),
    airportTrips: boundedNumber(value.airportTrips, 'Airport trips', 0, 20, true),
    includeWelcomeReset: value.includeWelcomeReset,
    includePreArrivalMaintenance: value.includePreArrivalMaintenance,
    errandHours: boundedNumber(value.errandHours, 'Errand hours', 0, 500),
    errandKilometers: boundedNumber(value.errandKilometers, 'Errand kilometers', 0, 10_000),
    selectedDayTrips: value.selectedDayTrips.map((trip) => requiredString(trip, 'Day trip', 120)),
    requestedSpecialistServices: value.requestedSpecialistServices.map((service) =>
      requiredString(service, 'Specialist service', 180)
    ),
    consultationPreference: value.consultationPreference,
    maintenanceNotes: optionalString(value.maintenanceNotes, 2000),
  };
}

function validateContact(value: unknown): ClientContactDetails {
  if (!isRecord(value)) return fail(400, 'Contact details are required.');
  const email = requiredString(value.email, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, 'Enter a valid email address.');
  let whatsappPhone = requiredString(value.whatsappPhone, 'WhatsApp number', 40).replace(/\D/g, '');
  if (whatsappPhone.startsWith('0') && whatsappPhone.length === 10) {
    whatsappPhone = `27${whatsappPhone.slice(1)}`;
  }
  if (whatsappPhone.length < 9 || whatsappPhone.length > 15) {
    return fail(400, 'Enter a valid WhatsApp number including its country code.');
  }
  return {
    fullName: requiredString(value.fullName, 'Full name', 160, 2),
    suburbOrResidence: requiredString(value.suburbOrResidence, 'Suburb or residence', 180),
    whatsappPhone,
    email,
    specialInstructions: optionalString(value.specialInstructions, 2000),
  };
}

async function adminLogin(request: Request, env: Env): Promise<Response> {
  if (!env.ADMIN_PASSWORD || !env.JWT_SECRET) {
    return fail(503, 'Team administrator credentials are not configured.');
  }
  if (env.JWT_SECRET.length < 32) {
    return fail(503, 'JWT_SECRET must be configured with at least 32 characters.');
  }
  const now = new Date(Date.now() - 10 * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);
  await env.manor_guardians_db.prepare('DELETE FROM admin_login_attempts WHERE attempted_at < ?').bind(now).run();
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const attempts = await env.manor_guardians_db.prepare(
    'SELECT COUNT(*) AS count FROM admin_login_attempts WHERE client_key = ? AND attempted_at >= ?'
  )
    .bind(ip, now)
    .first<{ count: number }>();
  if ((attempts?.count || 0) >= 5) {
    return fail(429, 'Too many sign-in attempts. Please wait and try again.');
  }

  const body = await readJson(request);
  const supplied = typeof body.password === 'string' ? body.password : '';
  const matches = equalBytes(await sha256(supplied), await sha256(env.ADMIN_PASSWORD));
  if (!matches) {
    await env.manor_guardians_db.prepare(
      'INSERT INTO admin_login_attempts (id, client_key) VALUES (?, ?)'
    )
      .bind(crypto.randomUUID(), ip)
      .run();
    return fail(401, 'The administrator password is incorrect.');
  }
  await env.manor_guardians_db.prepare('DELETE FROM admin_login_attempts WHERE client_key = ?').bind(ip).run();
  const session = await createAdminJwt(env);
  return json({ access_token: session.token, expires_at: session.expiresAt });
}

async function limitConsultationRequests(request: Request, env: Env): Promise<void> {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  await env.manor_guardians_db.prepare('DELETE FROM consultation_attempts WHERE attempted_at < ?')
    .bind(cutoff)
    .run();
  const attempts = await env.manor_guardians_db.prepare(
    'SELECT COUNT(*) AS count FROM consultation_attempts WHERE client_key = ? AND attempted_at >= ?'
  )
    .bind(ip, cutoff)
    .first<{ count: number }>();
  if ((attempts?.count || 0) >= 10) {
    return fail(429, 'Too many consultation requests. Please try again later.');
  }
  await env.manor_guardians_db.prepare(
    'INSERT INTO consultation_attempts (id, client_key) VALUES (?, ?)'
  )
    .bind(crypto.randomUUID(), ip)
    .run();
}

async function createConsultation(request: Request, env: Env): Promise<Response> {
  await limitConsultationRequests(request, env);
  const body = await readJson(request);
  const quoteInput = validateQuoteInput(body.quoteInput);
  const contact = validateContact(body.contact);
  const breakdown = calculateQuoteBreakdown(quoteInput);
  if (breakdown.totalDays < 1) return fail(400, 'The selected stay dates are invalid.');

  const clientId = crypto.randomUUID();
  const client = await env.manor_guardians_db.prepare(
    `INSERT INTO clients (id, full_name, email, whatsapp_number, suburb, estate_address)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(whatsapp_number) DO UPDATE SET
       full_name = excluded.full_name,
       email = excluded.email,
       suburb = excluded.suburb,
       estate_address = excluded.estate_address
     RETURNING id`
  )
    .bind(
      clientId,
      contact.fullName,
      contact.email,
      contact.whatsappPhone,
      contact.suburbOrResidence,
      contact.suburbOrResidence
    )
    .first<{ id: string }>();
  if (!client) return fail(500, 'We could not save your consultation contact details.');

  const portalToken = randomToken();
  const tokenHash = toHex(await sha256(portalToken));
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

  let stay: Pick<StayRow, 'id' | 'quote_ref' | 'status' | 'created_at'> | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const quoteRef = `PE-${new Date().getFullYear()}-${1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000)}`;
    const stayId = crypto.randomUUID();
    const result = await env.manor_guardians_db.prepare(
      `INSERT INTO stays (
         id, quote_ref, client_id, service_tier, start_date, end_date, airport_trips,
         day_trips, welcome_refresh, custom_notes, consult_format, subtotal_zar,
         festive_surcharge_zar, total_zar, deposit_zar, status, portal_token_hash
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'vetting_requested', ?)
       ON CONFLICT(quote_ref) DO NOTHING
       RETURNING id, quote_ref, status, created_at`
    )
      .bind(
        stayId,
        quoteRef,
        client.id,
        quoteInput.baseTier === 'vip-24-7' ? 'care_247' : 'care_checkin',
        quoteInput.checkInDate,
        quoteInput.checkOutDate,
        quoteInput.airportTrips,
        quoteInput.selectedDayTrips.length,
        quoteInput.includeWelcomeReset ? 1 : 0,
        notes,
        quoteInput.consultationPreference === 'in-home-meet-greet' ? 'in_home' : 'online',
        breakdown.subtotalBeforePeak,
        breakdown.peakSurchargeSubtotal,
        breakdown.estimatedTotal,
        breakdown.indicativeDepositAmount,
        tokenHash
      )
      .first<Pick<StayRow, 'id' | 'quote_ref' | 'status' | 'created_at'>>();
    if (result) {
      stay = result;
      break;
    }
  }
  if (!stay) return fail(503, 'We could not generate a unique booking reference. Please try again.');

  return json(
    {
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
      stay: { id: stay.id, quoteRef: stay.quote_ref, status: stay.status },
    },
    201
  );
}

function mapEmergency(value: unknown): EmergencyProtocolDetails {
  const protocol = isRecord(value) ? value : {};
  const contact = (value: unknown): EmergencyContactPerson => {
    const item = isRecord(value) ? value : {};
    return {
      fullName: optionalString(item.fullName, 160),
      relationship: optionalString(item.relationship, 160),
      phone: optionalString(item.phone, 40),
      email: optionalString(item.email, 254),
    };
  };
  return {
    primaryContact: contact(protocol.primaryContact),
    secondaryContact: contact(protocol.secondaryContact),
    urgentNote: optionalString(protocol.urgentNote, 1000),
  };
}

function mapDossier(row: Record<string, unknown> | null, fallback: string): ResidenceOnboardingDossier {
  let pets: unknown = [];
  let emergency: unknown = {};
  try {
    if (typeof row?.pet_profiles === 'string') pets = JSON.parse(row.pet_profiles);
    if (typeof row?.emergency_protocol === 'string') emergency = JSON.parse(row.emergency_protocol);
  } catch {
    return fail(500, 'The residence onboarding record contains invalid stored data.');
  }
  const rawPets = Array.isArray(pets) ? pets : [];
  return {
    residenceNameAndAddress: optionalString(row?.residence_name_and_address) || fallback,
    gateAccessProcedure: optionalString(row?.gate_access_procedure),
    armedResponseCompanyAndPassword: optionalString(row?.armed_response_company_and_password),
    waterShutoffAndDbLocations: optionalString(row?.water_and_db_locations),
    houseQuirks: optionalString(row?.house_quirks),
    pets: rawPets.filter(isRecord).map((pet, index) => ({
      id: optionalString(pet.id, 100) || `pet-${index + 1}`,
      name: optionalString(pet.name, 120),
      breed: optionalString(pet.breed, 120),
      feedingScheduleAndPortions: optionalString(pet.feeding, 1000),
      medicationsOrAllergies: optionalString(pet.meds, 1000),
      behavioralNotes: optionalString(pet.behavioralNotes, 1000),
      primaryVetContact: optionalString(pet.vet, 300),
    })),
    expectedReturnDateTime: optionalString(row?.expected_return_datetime, 100),
    fridgeGroceryList: optionalString(row?.welcome_groceries_and_flowers),
    laundryAndCurtainInstructions: optionalString(row?.laundry_instructions),
    emergencyProtocol: mapEmergency(emergency),
    savedAtIso: typeof row?.updated_at === 'string' ? row.updated_at : undefined,
    dossierId: typeof row?.id === 'string' ? row.id : undefined,
  };
}

function mapStatuses(value: unknown): StayStatusChecks {
  let statuses: unknown = value;
  try {
    if (typeof value === 'string') statuses = JSON.parse(value);
  } catch {
    statuses = {};
  }
  const item = isRecord(statuses) ? statuses : {};
  return {
    dogsFedWalked: item.dogsFedWalked === true,
    poolAndGarden: item.poolAndGarden === true,
    securityAndPowerOn: item.securityAndPowerOn === true,
  };
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Johannesburg',
  });
}

function formatUpdateTime(value: string): { dateLabel: string; timestampSast: string } {
  const date = new Date(value.endsWith('Z') ? value : `${value}Z`);
  return {
    dateLabel: date.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Africa/Johannesburg',
    }),
    timestampSast: `${date.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Johannesburg',
    })} SAST`,
  };
}

async function getPortal(request: Request, env: Env, quoteRef: string): Promise<Response> {
  const stay = await env.manor_guardians_db.prepare(
    `SELECT id, quote_ref, client_id, start_date, end_date, total_zar, deposit_zar,
            status, portal_token_hash, created_at
     FROM stays WHERE quote_ref = ?`
  )
    .bind(quoteRef)
    .first<StayRow>();
  if (!stay) return fail(404, 'No residence file was found for that booking reference.');
  await authorizeStay(request, env, stay);

  const [client, dossierRow, updatesResult, incidentalsResult, paymentsResult] = await Promise.all([
    env.manor_guardians_db.prepare(
      'SELECT full_name, suburb, estate_address FROM clients WHERE id = ?'
    )
      .bind(stay.client_id)
      .first<{ full_name: string; suburb: string | null; estate_address: string | null }>(),
    env.manor_guardians_db.prepare('SELECT * FROM onboarding_dossiers WHERE stay_id = ?')
      .bind(stay.id)
      .first<Record<string, unknown>>(),
    env.manor_guardians_db.prepare('SELECT * FROM daily_updates WHERE stay_id = ? ORDER BY created_at DESC')
      .bind(stay.id)
      .all<Record<string, unknown>>(),
    env.manor_guardians_db.prepare('SELECT * FROM incidentals WHERE stay_id = ? ORDER BY created_at DESC')
      .bind(stay.id)
      .all<Record<string, unknown>>(),
    env.manor_guardians_db.prepare('SELECT amount_zar, payment_type, status FROM payment_events WHERE stay_id = ?')
      .bind(stay.id)
      .all<{ amount_zar: number; payment_type: string; status: string }>(),
  ]);
  if (!client) return fail(404, 'The residence file does not have a client record.');

  const dossier = mapDossier(
    dossierRow,
    client.estate_address || client.suburb || 'Residence'
  );
  const updates = updatesResult.results.map((row) => {
    const time = formatUpdateTime(String(row.created_at));
    const photoKey = typeof row.photo_key === 'string' ? row.photo_key : '';
    return {
      id: String(row.id),
      slotTitle: optionalString(row.slot_title, 160) || 'Residence update',
      ...time,
      guardianName: optionalString(row.caretaker_name, 160),
      statuses: mapStatuses(row.status_checks),
      caretakerNotes: optionalString(row.notes),
      photoUrl: photoKey ? `/api/media/${photoKey.split('/').map(encodeURIComponent).join('/')}` : undefined,
      photoAlt: `${optionalString(row.slot_title, 160) || 'Residence'} photo update`,
    };
  });
  const incidentals = incidentalsResult.results.map((row) => {
    const receiptKey = typeof row.receipt_key === 'string' ? row.receipt_key : '';
    return {
      id: String(row.id),
      dateLabel: formatUpdateTime(String(row.created_at)).dateLabel,
      description: optionalString(row.description),
      loggedBy: optionalString(row.logged_by, 160),
      amountZar: Number(row.amount_zar),
      receiptUrl: receiptKey
        ? `/api/media/${receiptKey.split('/').map(encodeURIComponent).join('/')}`
        : undefined,
    };
  });
  const paid = paymentsResult.results.filter((payment) => payment.status === 'paid');
  const paidDeposit = paid
    .filter((payment) => payment.payment_type === 'deposit_50')
    .reduce((sum, payment) => sum + Number(payment.amount_zar), 0);
  const paidFinal = paid
    .filter((payment) => payment.payment_type === 'final_settlement')
    .reduce((sum, payment) => sum + Number(payment.amount_zar), 0);
  const billing = {
    referenceCode: stay.quote_ref,
    totalBookingQuotedZar: Number(stay.total_zar),
    initialDepositPaidZar: paidDeposit,
    remainingStayBalanceZar: Math.max(0, Number(stay.total_zar) - paidDeposit - paidFinal),
    incidentals,
  };
  const petsSummary = dossier.pets
    .map((pet) => `${pet.name || 'Pet'} (${pet.breed || 'Companion'})`)
    .join(', ');
  const data: ResidencePortalData = {
    dossier,
    session: {
      residenceName: dossier.residenceNameAndAddress,
      referenceCode: stay.quote_ref,
      datesLabel: `${formatDate(stay.start_date)} to ${formatDate(stay.end_date)}`,
      status: stay.status,
      leadGuardian: 'Pretoria East Family Team Lead',
      teamMembers: [],
      petsSummary: petsSummary || 'Registered Household Pets',
      nextUpdateTime: 'Daily updates are posted by the care team.',
      resetScheduled: 'To be confirmed',
      updates,
      billing,
    },
  };
  return json(data);
}

async function saveOnboarding(
  request: Request,
  env: Env,
  quoteRef: string
): Promise<Response> {
  const stay = await env.manor_guardians_db.prepare(
    'SELECT id, portal_token_hash FROM stays WHERE quote_ref = ?'
  )
    .bind(quoteRef)
    .first<Pick<StayRow, 'id' | 'portal_token_hash'>>();
  if (!stay) return fail(404, 'No residence file was found for that booking reference.');
  await authorizeStay(request, env, stay);
  const input = await readJson(request);
  if (!Array.isArray(input.pets) || input.pets.length > 30) {
    return fail(400, 'Pet profiles must be an array of up to 30 pets.');
  }
  const pets = input.pets.map((value, index) => {
    if (!isRecord(value)) return fail(400, `Pet profile ${index + 1} is invalid.`);
    return {
      id: optionalString(value.id, 100) || `pet-${index + 1}`,
      name: requiredString(value.name, 'Pet name', 120),
      breed: optionalString(value.breed, 120),
      feeding: requiredString(value.feedingScheduleAndPortions, 'Feeding instructions', 1000),
      meds: optionalString(value.medicationsOrAllergies, 1000),
      behavioralNotes: optionalString(value.behavioralNotes, 1000),
      vet: optionalString(value.primaryVetContact, 300),
    };
  });
  const dossierId = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.manor_guardians_db.prepare(
    `INSERT INTO onboarding_dossiers (
       id, stay_id, residence_name_and_address, gate_access_procedure,
       armed_response_company_and_password, water_and_db_locations, house_quirks,
       welcome_groceries_and_flowers, laundry_instructions, pet_profiles,
       expected_return_datetime, emergency_protocol, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(stay_id) DO UPDATE SET
       residence_name_and_address = excluded.residence_name_and_address,
       gate_access_procedure = excluded.gate_access_procedure,
       armed_response_company_and_password = excluded.armed_response_company_and_password,
       water_and_db_locations = excluded.water_and_db_locations,
       house_quirks = excluded.house_quirks,
       welcome_groceries_and_flowers = excluded.welcome_groceries_and_flowers,
       laundry_instructions = excluded.laundry_instructions,
       pet_profiles = excluded.pet_profiles,
       expected_return_datetime = excluded.expected_return_datetime,
       emergency_protocol = excluded.emergency_protocol,
       updated_at = excluded.updated_at`
  )
    .bind(
      dossierId,
      stay.id,
      requiredString(input.residenceNameAndAddress, 'Residence name and address', 300),
      requiredString(input.gateAccessProcedure, 'Gate access procedure'),
      requiredString(input.armedResponseCompanyAndPassword, 'Armed response company and password'),
      optionalString(input.waterShutoffAndDbLocations),
      optionalString(input.houseQuirks),
      optionalString(input.fridgeGroceryList),
      optionalString(input.laundryAndCurtainInstructions),
      JSON.stringify(pets),
      requiredString(input.expectedReturnDateTime, 'Expected return date', 100),
      JSON.stringify(mapEmergency(input.emergencyProtocol)),
      now
    )
    .run();
  const saved = await env.manor_guardians_db.prepare(
    'SELECT id, updated_at FROM onboarding_dossiers WHERE stay_id = ?'
  )
    .bind(stay.id)
    .first<{ id: string; updated_at: string }>();
  if (!saved) return fail(500, 'The onboarding dossier could not be saved.');
  return json({
    saved: true,
    dossierId: saved.id,
    savedAtIso: saved.updated_at,
    targetTable: 'onboarding_dossiers',
  });
}

function validImage(type: string, bytes: Uint8Array): boolean {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') {
    return [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  }
  if (type === 'image/webp') {
    return (
      decoder.decode(bytes.slice(0, 4)) === 'RIFF' &&
      decoder.decode(bytes.slice(8, 12)) === 'WEBP'
    );
  }
  return false;
}

function validReceipt(type: string, bytes: Uint8Array): boolean {
  if (type === 'application/pdf') return decoder.decode(bytes.slice(0, 5)) === '%PDF-';
  return validImage(type, bytes);
}

async function publishUpdate(request: Request, env: Env, quoteRef: string): Promise<Response> {
  await requireAdmin(request, env);
  const stay = await env.manor_guardians_db.prepare(
    'SELECT id, portal_token_hash FROM stays WHERE quote_ref = ?'
  )
    .bind(quoteRef)
    .first<Pick<StayRow, 'id' | 'portal_token_hash'>>();
  if (!stay) return fail(404, 'No residence file was found for that booking reference.');
  const form = await request.formData();
  const rawStatuses = form.get('statuses');
  let statusesValue: unknown;
  try {
    statusesValue = typeof rawStatuses === 'string' ? JSON.parse(rawStatuses) : null;
  } catch {
    return fail(400, 'Update status checks must be valid JSON.');
  }
  if (!isRecord(statusesValue)) return fail(400, 'Update status checks are required.');
  const statuses: StayStatusChecks = {
    dogsFedWalked: statusesValue.dogsFedWalked === true,
    poolAndGarden: statusesValue.poolAndGarden === true,
    securityAndPowerOn: statusesValue.securityAndPowerOn === true,
  };
  const caretaker = requiredString(form.get('guardianName'), 'Caretaker name', 160);
  const slotTitle = requiredString(form.get('slotTitle'), 'Update title', 160);
  const notes = requiredString(form.get('notes'), 'Update notes');
  const id = crypto.randomUUID();
  const file = form.get('photo');
  let photoKey: string | null = null;
  let contentType = '';
  let photoBytes: Uint8Array | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) return fail(413, 'The uploaded photo exceeds 10 MB.');
    contentType = file.type;
    photoBytes = new Uint8Array(await file.arrayBuffer());
    if (!validImage(contentType, photoBytes)) {
      return fail(400, 'Upload a valid JPEG, PNG, or WebP photo.');
    }
    const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    photoKey = `${stay.id}/${crypto.randomUUID()}.${extension}`;
    await env.manor_guardians_media.put(photoKey, photoBytes, { httpMetadata: { contentType } });
  }
  const createdAt = new Date().toISOString();
  try {
    await env.manor_guardians_db.prepare(
      `INSERT INTO daily_updates (
         id, stay_id, caretaker_name, slot_title, pets_status,
         property_security_status, status_checks, notes, photo_key, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        stay.id,
        caretaker,
        slotTitle,
        statuses.dogsFedWalked ? 'Fed / walked' : 'Not yet verified',
        statuses.securityAndPowerOn
          ? 'Security and power checked'
          : 'Security and power require follow-up',
        JSON.stringify(statuses),
        notes,
        photoKey,
        createdAt
      )
      .run();
  } catch (error) {
    if (photoKey) await env.manor_guardians_media.delete(photoKey);
    console.error('Daily update insert failed:', error);
    return fail(500, 'The daily update could not be published.');
  }
  const time = formatUpdateTime(createdAt);
  return json(
    {
      update: {
        id,
        slotTitle,
        ...time,
        guardianName: caretaker,
        statuses,
        caretakerNotes: notes,
        photoUrl: photoKey
          ? `/api/media/${photoKey.split('/').map(encodeURIComponent).join('/')}`
          : undefined,
        photoAlt: `${slotTitle} photo update`,
      },
    },
    201
  );
}

async function getMedia(request: Request, env: Env, path: string): Promise<Response> {
  const match = /^\/api\/media\/([a-f0-9-]{36})\/([A-Za-z0-9._-]{1,120})$/i.exec(path);
  if (!match) return fail(404, 'Media file was not found.');
  const [, stayId, fileName] = match;
  await authorizeStayId(request, env, stayId);
  const object = await env.manor_guardians_media.get(`${stayId}/${fileName}`);
  if (!object) return fail(404, 'Media file was not found.');
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Length': String(object.size),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}

interface PaystackResult {
  response: Response;
  payload: unknown;
}

async function callPaystack(
  secret: string,
  path: string,
  body?: Record<string, unknown>
): Promise<PaystackResult> {
  let response: Response;
  try {
    response = await fetch(`https://api.paystack.co${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    console.error('Paystack request failed:', error);
    return fail(502, 'Paystack could not be reached. Please try again.');
  }
  return { response, payload: await response.json().catch(() => null) };
}

function paystackData(result: PaystackResult, action: string): Record<string, unknown> {
  if (
    !result.response.ok ||
    !isRecord(result.payload) ||
    result.payload.status !== true ||
    !isRecord(result.payload.data)
  ) {
    const message = isRecord(result.payload) ? result.payload.message : 'Unexpected response.';
    console.error(`Paystack ${action} failed:`, message);
    return fail(502, `Paystack could not ${action}. Please try again.`);
  }
  return result.payload.data;
}

async function getPaystackCustomer(
  env: Env,
  client: ClientRow
): Promise<string> {
  if (!env.PAYSTACK_SECRET_KEY) return fail(503, 'Paystack server credentials are not configured.');
  if (!client.email) return fail(409, 'Add a client email before creating an invoice.');
  if (client.paystack_customer_code) return client.paystack_customer_code;
  const secret = env.PAYSTACK_SECRET_KEY;
  const lookup = await callPaystack(secret, `/customer/${encodeURIComponent(client.email)}`);
  let code: string;
  if (lookup.response.ok) {
    const data = paystackData(lookup, 'load the customer');
    if (typeof data.customer_code !== 'string') return fail(502, 'Paystack did not return a customer code.');
    code = data.customer_code;
  } else if (lookup.response.status === 404) {
    const nameParts = client.full_name.trim().split(/\s+/);
    const created = await callPaystack(secret, '/customer', {
      email: client.email,
      first_name: nameParts[0] || client.full_name,
      last_name: nameParts.slice(1).join(' '),
      phone: client.whatsapp_number,
    });
    const data = paystackData(created, 'create the customer');
    if (typeof data.customer_code !== 'string') return fail(502, 'Paystack did not return a customer code.');
    code = data.customer_code;
  } else {
    paystackData(lookup, 'load the customer');
    return fail(502, 'Paystack did not return a customer record.');
  }
  await env.manor_guardians_db.prepare('UPDATE clients SET paystack_customer_code = ? WHERE id = ?')
    .bind(code, client.id)
    .run();
  return code;
}

async function createInvoice(request: Request, env: Env): Promise<Response> {
  await requireAdmin(request, env);
  if (!env.PAYSTACK_SECRET_KEY) return fail(503, 'Paystack server credentials are not configured.');
  const body = await readJson(request);
  const quoteRef = typeof body.quoteRef === 'string' ? normalizeQuoteRef(body.quoteRef) : '';
  const paymentType = body.paymentType;
  if (!QUOTE_REF_PATTERN.test(quoteRef)) return fail(400, 'Enter a valid residence booking reference.');
  if (paymentType !== 'deposit_50' && paymentType !== 'final_settlement') {
    return fail(400, 'Choose a valid invoice type.');
  }
  const stay = await env.manor_guardians_db.prepare(
    'SELECT id, client_id, status, total_zar, deposit_zar FROM stays WHERE quote_ref = ?'
  )
    .bind(quoteRef)
    .first<Pick<StayRow, 'id' | 'client_id' | 'status' | 'total_zar' | 'deposit_zar'>>();
  if (!stay) return fail(404, 'No residence file was found for that booking reference.');
  const client = await env.manor_guardians_db.prepare(
    `SELECT id, full_name, email, whatsapp_number, paystack_customer_code
     FROM clients WHERE id = ?`
  )
    .bind(stay.client_id)
    .first<ClientRow>();
  if (!client) return fail(404, 'The client record could not be loaded.');
  const paymentResult = await env.manor_guardians_db.prepare(
    'SELECT id, stay_id, payment_type, amount_zar, status FROM payment_events WHERE stay_id = ?'
  )
    .bind(stay.id)
    .all<PaymentRow>();
  const events = paymentResult.results;
  let amountZar: number;
  let description: string;
  let lineItems: Array<{ name: string; amount: number; quantity: number }>;
  if (paymentType === 'deposit_50') {
    if (stay.status !== 'vetting_approved') {
      return fail(409, 'A deposit can only be invoiced after vetting is approved.');
    }
    if (events.some((item) => item.payment_type === 'deposit_50' && item.status === 'paid')) {
      return fail(409, 'The deposit has already been paid.');
    }
    amountZar = Number(stay.deposit_zar);
    description = `50% booking deposit for ${quoteRef}`;
    lineItems = [{ name: `50% booking deposit: ${quoteRef}`, amount: Math.round(amountZar * 100), quantity: 1 }];
  } else {
    if (stay.status !== 'confirmed' && stay.status !== 'active') {
      return fail(409, 'Final settlement is available only for a confirmed or active stay.');
    }
    const paidDeposit = events
      .filter((item) => item.payment_type === 'deposit_50' && item.status === 'paid')
      .reduce((sum, item) => sum + Number(item.amount_zar), 0);
    const paidFinal = events
      .filter((item) => item.payment_type === 'final_settlement' && item.status === 'paid')
      .reduce((sum, item) => sum + Number(item.amount_zar), 0);
    const incidentals = await env.manor_guardians_db.prepare(
      'SELECT COALESCE(SUM(amount_zar), 0) AS total FROM incidentals WHERE stay_id = ?'
    )
      .bind(stay.id)
      .first<{ total: number }>();
    const balance = Math.max(0, Number(stay.total_zar) - paidDeposit - paidFinal);
    const incidentalTotal = Number(incidentals?.total || 0);
    amountZar = balance + incidentalTotal;
    if (amountZar <= 0) return fail(409, 'There is no outstanding final balance.');
    description = `Final stay settlement and incidentals for ${quoteRef}`;
    lineItems = [
      ...(balance > 0
        ? [{ name: `Remaining stay balance: ${quoteRef}`, amount: Math.round(balance * 100), quantity: 1 }]
        : []),
      ...(incidentalTotal > 0
        ? [{ name: `Logged stay incidentals: ${quoteRef}`, amount: Math.round(incidentalTotal * 100), quantity: 1 }]
        : []),
    ];
  }
  const customer = await getPaystackCustomer(env, client);
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const paymentId = crypto.randomUUID();
  const placeholderReference = `pending-${paymentId}`;
  try {
    await env.manor_guardians_db.prepare(
      `INSERT INTO payment_events (id, stay_id, paystack_reference, payment_type, amount_zar)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(paymentId, stay.id, placeholderReference, paymentType, amountZar)
      .run();
  } catch {
    return fail(409, 'A payment request is already pending for this stay.');
  }

  let requestCode = '';
  const minorAmount = Math.round(amountZar * 100);
  try {
    const response = await callPaystack(env.PAYSTACK_SECRET_KEY, '/paymentrequest', {
      customer,
      currency: 'ZAR',
      description,
      due_date: dueDate.toISOString(),
      line_items: lineItems,
      send_notification: false,
    });
    const data = paystackData(response, 'create the payment request');
    requestCode = typeof data.request_code === 'string' ? data.request_code : '';
    if (!requestCode || data.currency !== 'ZAR' || data.amount !== minorAmount) {
      return fail(502, 'Paystack returned an invalid payment request.');
    }
    await env.manor_guardians_db.prepare(
      `UPDATE payment_events SET paystack_reference = ? WHERE id = ? AND status = 'pending'`
    )
      .bind(requestCode, paymentId)
      .run();
  } catch (error) {
    await env.manor_guardians_db.prepare(
      `UPDATE payment_events SET status = 'failed'
       WHERE id = ? AND status = 'pending'`
    )
      .bind(paymentId)
      .run();
    throw error;
  }

  let emailSent = true;
  const notification = await callPaystack(
    env.PAYSTACK_SECRET_KEY,
    `/paymentrequest/notify/${encodeURIComponent(requestCode)}`,
    {}
  ).catch(() => null);
  if (
    !notification ||
    !notification.response.ok ||
    !isRecord(notification.payload) ||
    notification.payload.status !== true
  ) {
    emailSent = false;
    console.error('Paystack invoice notification failed:', notification?.payload);
  }
  return json(
    {
      provider: 'paystack',
      requestCode,
      amountZar,
      amountKoboOrCents: minorAmount,
      currency: 'ZAR',
      expiresAtIso: dueDate.toISOString(),
      emailSent,
    },
    201
  );
}

async function signatureMatches(
  body: ArrayBuffer,
  provided: string | null,
  secret: string,
  algorithm: 'SHA-512' | 'SHA-256',
  prefix = ''
): Promise<boolean> {
  if (!provided) return false;
  const value = provided.startsWith(prefix) ? provided.slice(prefix.length) : provided;
  const supplied = fromHex(value);
  if (!supplied) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  );
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, body));
  return equalBytes(expected, supplied);
}

async function paystackWebhook(request: Request, env: Env): Promise<Response> {
  if (!env.PAYSTACK_SECRET_KEY) return fail(503, 'Paystack webhook credentials are not configured.');
  const raw = await request.arrayBuffer();
  if (!(await signatureMatches(raw, request.headers.get('x-paystack-signature'), env.PAYSTACK_SECRET_KEY, 'SHA-512'))) {
    return fail(401, 'Paystack webhook signature is invalid.');
  }
  let payload: unknown;
  try {
    payload = JSON.parse(decoder.decode(raw));
  } catch {
    return fail(400, 'The Paystack webhook body is invalid JSON.');
  }
  if (!isRecord(payload) || !isRecord(payload.data)) return fail(400, 'The Paystack webhook payload is incomplete.');
  if (payload.event !== 'paymentrequest.success') return json({ received: true });
  const data = payload.data;
  if (typeof data.request_code !== 'string' || typeof data.amount !== 'number' || data.currency !== 'ZAR') {
    return fail(400, 'The Paystack payment event is missing its invoice details.');
  }
  const payment = await env.manor_guardians_db.prepare(
    'SELECT id, stay_id, payment_type, amount_zar, status FROM payment_events WHERE paystack_reference = ?'
  )
    .bind(data.request_code)
    .first<PaymentRow>();
  if (!payment) {
    console.error('Paystack event has an unknown request code:', data.request_code);
    return json({ received: true });
  }
  if (!Number.isSafeInteger(data.amount) || data.amount !== Math.round(Number(payment.amount_zar) * 100)) {
    return fail(400, 'The Paystack payment amount does not match the invoice.');
  }
  const nextStatus = payment.payment_type === 'deposit_50' ? 'confirmed' : 'completed';
  await env.manor_guardians_db.prepare(
    `UPDATE payment_events SET status = 'paid', paid_at = ?
     WHERE id = ? AND status IN ('pending', 'failed')`
  )
    .bind(new Date().toISOString(), payment.id)
    .run();
  await env.manor_guardians_db.prepare('UPDATE stays SET status = ? WHERE id = ?')
    .bind(nextStatus, payment.stay_id)
    .run();
  return json({ received: true, duplicate: payment.status === 'paid' });
}

async function whatsappWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    const url = new URL(request.url);
    if (
      env.WEBHOOK_VERIFY_TOKEN &&
      url.searchParams.get('hub.mode') === 'subscribe' &&
      url.searchParams.get('hub.verify_token') === env.WEBHOOK_VERIFY_TOKEN
    ) {
      return new Response(url.searchParams.get('hub.challenge') || '', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    return fail(403, 'WhatsApp webhook verification failed.');
  }
  if (!env.META_APP_SECRET) return fail(503, 'WhatsApp webhook credentials are not configured.');
  const raw = await request.arrayBuffer();
  if (
    !(await signatureMatches(
      raw,
      request.headers.get('x-hub-signature-256'),
      env.META_APP_SECRET,
      'SHA-256',
      'sha256='
    ))
  ) {
    return fail(401, 'WhatsApp webhook signature is invalid.');
  }
  return json({ received: true });
}

async function routeApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === '/api/health' && request.method === 'GET') return json({ status: 'ok' });
  if (path === '/api/admin/login' && request.method === 'POST') return adminLogin(request, env);
  if (path === '/api/consultations' && request.method === 'POST') return createConsultation(request, env);
  if (path === '/api/paystack/invoice' && request.method === 'POST') return createInvoice(request, env);
  if (path === '/api/webhooks/paystack' && request.method === 'POST') return paystackWebhook(request, env);
  if (path === '/api/webhooks/whatsapp' && ['GET', 'POST'].includes(request.method)) {
    return whatsappWebhook(request, env);
  }
  if (path.startsWith('/api/media/') && request.method === 'GET') return getMedia(request, env, path);

  const portalMatch = /^\/api\/portal\/([^/]+)(?:\/(onboarding|updates|incidentals))?$/.exec(path);
  if (portalMatch) {
    let quoteRef: string;
    try {
      quoteRef = normalizeQuoteRef(decodeURIComponent(portalMatch[1]));
    } catch {
      return fail(400, 'Enter a valid residence booking reference.');
    }
    if (!QUOTE_REF_PATTERN.test(quoteRef)) return fail(400, 'Enter a valid residence booking reference.');
    const action = portalMatch[2];
    if (!action && request.method === 'GET') return getPortal(request, env, quoteRef);
    if (action === 'onboarding' && request.method === 'POST') return saveOnboarding(request, env, quoteRef);
    if (action === 'updates' && request.method === 'POST') return publishUpdate(request, env, quoteRef);
    if (action === 'incidentals' && request.method === 'POST') return createIncidental(request, env, quoteRef);
  }
  return fail(404, 'API route not found.');
}

async function createIncidental(request: Request, env: Env, quoteRef: string): Promise<Response> {
  await requireAdmin(request, env);
  const stay = await env.manor_guardians_db.prepare(
    'SELECT id FROM stays WHERE quote_ref = ?'
  )
    .bind(quoteRef)
    .first<{ id: string }>();
  if (!stay) return fail(404, 'No residence file was found for that booking reference.');
  const contentType = request.headers.get('content-type') || '';
  let descriptionValue: FormDataEntryValue | unknown;
  let amountValue: FormDataEntryValue | unknown;
  let loggedByValue: FormDataEntryValue | unknown;
  let receipt: File | null = null;
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    descriptionValue = form.get('description');
    amountValue = form.get('amountZar');
    loggedByValue = form.get('loggedBy');
    const file = form.get('receipt');
    if (file instanceof File && file.size > 0) receipt = file;
  } else {
    const body = await readJson(request);
    descriptionValue = body.description;
    amountValue = body.amountZar;
    loggedByValue = body.loggedBy;
  }
  const description = requiredString(descriptionValue, 'Expense description', 500);
  const amount = boundedNumber(
    typeof amountValue === 'string' ? Number(amountValue) : amountValue,
    'Expense amount',
    0.01,
    1_000_000
  );
  const loggedBy = requiredString(loggedByValue, 'Team member name', 160);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  let receiptKey: string | null = null;
  if (receipt) {
    if (receipt.size > 10 * 1024 * 1024) return fail(413, 'The till slip exceeds 10 MB.');
    const receiptType = receipt.type;
    const receiptBytes = new Uint8Array(await receipt.arrayBuffer());
    if (!validReceipt(receiptType, receiptBytes)) {
      return fail(400, 'Upload a valid JPEG, PNG, WebP, or PDF till slip.');
    }
    const extension =
      receiptType === 'application/pdf'
        ? 'pdf'
        : receiptType === 'image/png'
          ? 'png'
          : receiptType === 'image/webp'
            ? 'webp'
            : 'jpg';
    receiptKey = `${stay.id}/${crypto.randomUUID()}.${extension}`;
    await env.manor_guardians_media.put(receiptKey, receiptBytes, {
      httpMetadata: { contentType: receiptType },
    });
  }
  try {
    await env.manor_guardians_db.prepare(
      `INSERT INTO incidentals (
         id, stay_id, description, amount_zar, logged_by, receipt_key, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, stay.id, description, amount, loggedBy, receiptKey, createdAt)
      .run();
  } catch (error) {
    if (receiptKey) await env.manor_guardians_media.delete(receiptKey);
    console.error('Incidental insert failed:', error);
    return fail(500, 'The expense could not be logged.');
  }
  return json(
    {
      expense: {
        id,
        dateLabel: formatUpdateTime(createdAt).dateLabel,
        description,
        loggedBy,
        amountZar: amount,
        receiptUrl: receiptKey
          ? `/api/media/${receiptKey.split('/').map(encodeURIComponent).join('/')}`
          : undefined,
      },
    },
    201
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }
    try {
      return await routeApi(request, env);
    } catch (error) {
      if (error instanceof ApiError) return json({ error: error.message }, error.status);
      console.error('Unhandled Worker API error:', error);
      return json({ error: 'An unexpected server error occurred.' }, 500);
    }
  },
};
