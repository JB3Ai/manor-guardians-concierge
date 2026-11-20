import { randomUUID } from 'node:crypto';
import { Request, Response, Router } from 'express';
import multer from 'multer';
import {
  EmergencyContactPerson,
  IncidentalExpenseItem,
  PortalDailyUpdate,
  ResidenceOnboardingDossier,
  ResidencePortalData,
  StayBillingLedger,
  StayStatusChecks,
} from '../src/types/concierge';
import { authorizeStayAccess, requireTeamAdmin } from './auth';
import { asyncRoute, HttpError } from './http';
import { getSupabaseAdmin } from './supabase';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(new HttpError(400, 'Upload a JPEG, PNG, or WebP photo.'));
      return;
    }
    callback(null, true);
  },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string, maximum = 2000): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maximum) {
    throw new HttpError(400, `${field} is required and must be under ${maximum} characters.`);
  }
  return value.trim();
}

function optionalString(value: unknown, maximum = 2000): string {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

function normalizeQuoteRef(value: string): string {
  return value.trim().replace(/^#/, '').toUpperCase();
}

async function findStay(quoteRefValue: string) {
  const quoteRef = normalizeQuoteRef(quoteRefValue);
  if (!/^PE-\d{4}-\d{4}$/.test(quoteRef)) {
    throw new HttpError(400, 'Enter a valid residence booking reference.');
  }
  const { data, error } = await getSupabaseAdmin()
    .from('stays')
    .select(
      'id, quote_ref, client_id, start_date, end_date, total_zar, deposit_zar, status, created_at, portal_token_hash'
    )
    .eq('quote_ref', quoteRef)
    .maybeSingle();
  if (error) {
    console.error('Stay lookup failed:', error.message);
    throw new HttpError(502, 'The residence file could not be loaded. Please try again.');
  }
  if (!data) throw new HttpError(404, 'No residence file was found for that booking reference.');
  return data;
}

function emptyContact(): EmergencyContactPerson {
  return { fullName: '', relationship: '', phone: '', email: '' };
}

function mapDossier(row: Record<string, unknown> | null, residenceFallback: string): ResidenceOnboardingDossier {
  const protocol = isRecord(row?.emergency_protocol) ? row.emergency_protocol : {};
  const primaryContact = isRecord(protocol.primaryContact) ? protocol.primaryContact : {};
  const secondaryContact = isRecord(protocol.secondaryContact) ? protocol.secondaryContact : {};
  const pets = Array.isArray(row?.pet_profiles) ? row.pet_profiles : [];
  return {
    residenceNameAndAddress:
      optionalString(row?.residence_name_and_address) || residenceFallback,
    gateAccessProcedure: optionalString(row?.gate_access_procedure),
    armedResponseCompanyAndPassword: optionalString(
      row?.armed_response_company_and_password
    ),
    waterShutoffAndDbLocations: optionalString(row?.water_and_db_locations),
    houseQuirks: optionalString(row?.house_quirks),
    pets: pets.filter(isRecord).map((pet, index) => ({
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
    emergencyProtocol: {
      primaryContact: {
        fullName: optionalString(primaryContact.fullName, 160),
        relationship: optionalString(primaryContact.relationship, 160),
        phone: optionalString(primaryContact.phone, 40),
        email: optionalString(primaryContact.email, 254),
      },
      secondaryContact: {
        fullName: optionalString(secondaryContact.fullName, 160),
        relationship: optionalString(secondaryContact.relationship, 160),
        phone: optionalString(secondaryContact.phone, 40),
        email: optionalString(secondaryContact.email, 254),
      },
      urgentNote: optionalString(protocol.urgentNote, 1000),
    },
    savedAtIso: typeof row?.updated_at === 'string' ? row.updated_at : undefined,
    dossierId: typeof row?.id === 'string' ? row.id : undefined,
  };
}

function mapStatuses(value: unknown): StayStatusChecks {
  const statuses = isRecord(value) ? value : {};
  return {
    dogsFedWalked: statuses.dogsFedWalked === true,
    poolAndGarden: statuses.poolAndGarden === true,
    securityAndPowerOn: statuses.securityAndPowerOn === true,
  };
}

async function signPhotoUrl(photoPath: string | null): Promise<string | undefined> {
  if (!photoPath) return undefined;
  const { data, error } = await getSupabaseAdmin()
    .storage.from('stay-media')
    .createSignedUrl(photoPath, 300);
  if (error || !data?.signedUrl) {
    console.error('Photo URL signing failed:', error?.message);
    throw new HttpError(502, 'A residence photo could not be loaded. Please refresh the portal.');
  }
  return data.signedUrl;
}

async function mapUpdate(row: Record<string, unknown>): Promise<PortalDailyUpdate> {
  const createdAt = typeof row.created_at === 'string' ? new Date(row.created_at) : new Date();
  return {
    id: String(row.id),
    slotTitle: optionalString(row.slot_title, 160) || 'Residence update',
    dateLabel: createdAt.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Africa/Johannesburg',
    }),
    timestampSast: `${createdAt.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Johannesburg',
    })} SAST`,
    guardianName: optionalString(row.caretaker_name, 160),
    statuses: mapStatuses(row.status_checks),
    caretakerNotes: optionalString(row.notes),
    photoUrl: await signPhotoUrl(typeof row.photo_url === 'string' ? row.photo_url : null),
    photoAlt: `${optionalString(row.slot_title, 160) || 'Residence'} photo update`,
  };
}

function normalizeIncidentals(rows: Record<string, unknown>[]): IncidentalExpenseItem[] {
  return rows.map((row) => {
    const createdAt = typeof row.created_at === 'string' ? new Date(row.created_at) : new Date();
    return {
      id: String(row.id),
      dateLabel: createdAt.toLocaleDateString('en-ZA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Africa/Johannesburg',
      }),
      description: optionalString(row.description),
      loggedBy: optionalString(row.logged_by, 160),
      amountZar: Number(row.amount_zar),
    };
  });
}

router.get(
  '/:quoteRef',
  asyncRoute(async (request: Request, response: Response) => {
    if (!request.get('authorization') && !request.get('x-portal-token')) {
      throw new HttpError(401, 'A private portal token or team administrator session is required.');
    }
    const stay = await findStay(request.params.quoteRef);
    await authorizeStayAccess(request, stay.portal_token_hash, true);
    const supabase = getSupabaseAdmin();
    const [clientResult, dossierResult, updatesResult, incidentalsResult, paymentsResult] =
      await Promise.all([
        supabase
          .from('clients')
          .select('full_name, suburb, estate_address')
          .eq('id', stay.client_id)
          .single(),
        supabase
          .from('onboarding_dossiers')
          .select('*')
          .eq('stay_id', stay.id)
          .maybeSingle(),
        supabase
          .from('daily_updates')
          .select('*')
          .eq('stay_id', stay.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('incidentals')
          .select('*')
          .eq('stay_id', stay.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('payment_events')
          .select('amount_zar, payment_type, status')
          .eq('stay_id', stay.id),
      ]);
    const queryErrors = [
      clientResult.error,
      dossierResult.error,
      updatesResult.error,
      incidentalsResult.error,
      paymentsResult.error,
    ].filter(Boolean);
    if (queryErrors.length > 0) {
      console.error('Portal data lookup failed:', queryErrors.map((error) => error?.message));
      throw new HttpError(502, 'The residence portal could not be loaded. Please try again.');
    }

    const client = clientResult.data;
    if (!client) throw new HttpError(404, 'The residence file does not have a client record.');
    const dossierRow = dossierResult.data as Record<string, unknown> | null;
    const dossier = mapDossier(dossierRow, client.estate_address || client.suburb || 'Residence');
    const updates = await Promise.all(
      (updatesResult.data || []).map((row) => mapUpdate(row as Record<string, unknown>))
    );
    const incidentals = normalizeIncidentals(
      (incidentalsResult.data || []) as Record<string, unknown>[]
    );
    const paidEvents = paymentsResult.data || [];
    const paidDeposit = paidEvents
      .filter((payment) => payment.payment_type === 'deposit_50' && payment.status === 'paid')
      .reduce((sum, payment) => sum + Number(payment.amount_zar), 0);
    const paidFinal = paidEvents
      .filter((payment) => payment.payment_type === 'final_settlement' && payment.status === 'paid')
      .reduce((sum, payment) => sum + Number(payment.amount_zar), 0);
    const total = Number(stay.total_zar);
    const billing: StayBillingLedger = {
      referenceCode: stay.quote_ref,
      totalBookingQuotedZar: total,
      initialDepositPaidZar: paidDeposit,
      remainingStayBalanceZar: Math.max(0, total - paidDeposit - paidFinal),
      incidentals,
    };
    const dates = `${new Date(`${stay.start_date}T00:00:00Z`).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Africa/Johannesburg',
    })} to ${new Date(`${stay.end_date}T00:00:00Z`).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Africa/Johannesburg',
    })}`;
    const petsSummary = dossier.pets
      .map((pet) => `${pet.name || 'Pet'} (${pet.breed || 'Companion'})`)
      .join(', ');
    const portalData: ResidencePortalData = {
      dossier,
      session: {
        residenceName: dossier.residenceNameAndAddress,
        referenceCode: stay.quote_ref,
        datesLabel: dates,
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
    response.json(portalData);
  })
);

router.post(
  '/:quoteRef/onboarding',
  asyncRoute(async (request: Request, response: Response) => {
    if (!request.get('authorization') && !request.get('x-portal-token')) {
      throw new HttpError(401, 'A private portal token or team administrator session is required.');
    }
    const stay = await findStay(request.params.quoteRef);
    await authorizeStayAccess(request, stay.portal_token_hash, true);
    if (!isRecord(request.body)) throw new HttpError(400, 'A dossier JSON body is required.');
    const input = request.body as Record<string, unknown>;
    if (!Array.isArray(input.pets) || input.pets.length > 30) {
      throw new HttpError(400, 'Pet profiles must be an array of up to 30 pets.');
    }
    const pets = input.pets.map((value, index) => {
      if (!isRecord(value)) throw new HttpError(400, `Pet profile ${index + 1} is invalid.`);
      return {
        name: requiredString(value.name, 'Pet name', 120),
        breed: optionalString(value.breed, 120),
        feeding: requiredString(value.feedingScheduleAndPortions, 'Feeding instructions', 1000),
        meds: optionalString(value.medicationsOrAllergies, 1000),
        behavioralNotes: optionalString(value.behavioralNotes, 1000),
        vet: optionalString(value.primaryVetContact, 300),
      };
    });
    const emergencyProtocol = isRecord(input.emergencyProtocol) ? input.emergencyProtocol : {};
    const primary = isRecord(emergencyProtocol.primaryContact)
      ? emergencyProtocol.primaryContact
      : {};
    const secondary = isRecord(emergencyProtocol.secondaryContact)
      ? emergencyProtocol.secondaryContact
      : {};
    const emergency = {
      primaryContact: {
        fullName: optionalString(primary.fullName, 160),
        relationship: optionalString(primary.relationship, 160),
        phone: optionalString(primary.phone, 40),
        email: optionalString(primary.email, 254),
      },
      secondaryContact: {
        fullName: optionalString(secondary.fullName, 160),
        relationship: optionalString(secondary.relationship, 160),
        phone: optionalString(secondary.phone, 40),
        email: optionalString(secondary.email, 254),
      },
      urgentNote: optionalString(emergencyProtocol.urgentNote, 1000),
    };
    const now = new Date().toISOString();
    const { data, error } = await getSupabaseAdmin()
      .from('onboarding_dossiers')
      .upsert(
        {
          stay_id: stay.id,
          residence_name_and_address: requiredString(
            input.residenceNameAndAddress,
            'Residence name and address',
            300
          ),
          gate_access_procedure: requiredString(input.gateAccessProcedure, 'Gate access procedure'),
          armed_response_company_and_password: requiredString(
            input.armedResponseCompanyAndPassword,
            'Armed response company and password'
          ),
          water_and_db_locations: optionalString(input.waterShutoffAndDbLocations),
          house_quirks: optionalString(input.houseQuirks),
          welcome_groceries_and_flowers: optionalString(input.fridgeGroceryList),
          laundry_instructions: optionalString(input.laundryAndCurtainInstructions),
          pet_profiles: pets,
          expected_return_datetime: requiredString(input.expectedReturnDateTime, 'Expected return date'),
          emergency_protocol: emergency,
          updated_at: now,
        },
        { onConflict: 'stay_id' }
      )
      .select('id, updated_at')
      .single();
    if (error || !data) {
      console.error('Dossier save failed:', error?.message);
      throw new HttpError(502, 'The onboarding dossier could not be saved. Please try again.');
    }
    response.json({
      saved: true,
      dossierId: data.id,
      savedAtIso: data.updated_at,
      targetTable: 'onboarding_dossiers',
    });
  })
);

router.post(
  '/:quoteRef/updates',
  asyncRoute(async (request, _response, next) => {
    await requireTeamAdmin(request);
    next();
  }),
  upload.single('photo'),
  asyncRoute(async (request: Request, response: Response) => {
    const stay = await findStay(request.params.quoteRef);
    const statusesValue = typeof request.body.statuses === 'string'
      ? JSON.parse(request.body.statuses)
      : request.body.statuses;
    if (!isRecord(statusesValue)) throw new HttpError(400, 'Update status checks are required.');
    const statuses: StayStatusChecks = {
      dogsFedWalked: statusesValue.dogsFedWalked === true,
      poolAndGarden: statusesValue.poolAndGarden === true,
      securityAndPowerOn: statusesValue.securityAndPowerOn === true,
    };
    const caretakerName = requiredString(request.body.guardianName, 'Caretaker name', 160);
    const slotTitle = requiredString(request.body.slotTitle, 'Update title', 160);
    const notes = requiredString(request.body.notes, 'Update notes');
    let photoPath: string | null = null;
    const file = request.file;
    if (file) {
      const extension = file.mimetype === 'image/png'
        ? 'png'
        : file.mimetype === 'image/webp'
          ? 'webp'
          : 'jpg';
      photoPath = `${stay.id}/${randomUUID()}.${extension}`;
      const { error: uploadError } = await getSupabaseAdmin()
        .storage.from('stay-media')
        .upload(photoPath, file.buffer, { contentType: file.mimetype, upsert: false });
      if (uploadError) {
        console.error('Stay photo upload failed:', uploadError.message);
        throw new HttpError(502, 'The stay photo could not be uploaded. Please try again.');
      }
    }

    const { data, error } = await getSupabaseAdmin()
      .from('daily_updates')
      .insert({
        stay_id: stay.id,
        caretaker_name: caretakerName,
        slot_title: slotTitle,
        pets_status: statuses.dogsFedWalked ? 'Fed / walked' : 'Not yet verified',
        property_security_status: statuses.securityAndPowerOn
          ? 'Security and power checked'
          : 'Security and power require follow-up',
        status_checks: statuses,
        notes,
        photo_url: photoPath,
      })
      .select('*')
      .single();
    if (error || !data) {
      if (photoPath) {
        const { error: cleanupError } = await getSupabaseAdmin()
          .storage.from('stay-media')
          .remove([photoPath]);
        if (cleanupError) console.error('Orphan photo cleanup failed:', cleanupError.message);
      }
      console.error('Daily update insert failed:', error?.message);
      throw new HttpError(502, 'The daily update could not be published. Please try again.');
    }
    response.status(201).json({ update: await mapUpdate(data as Record<string, unknown>) });
  })
);

router.post(
  '/:quoteRef/incidentals',
  asyncRoute(async (request: Request, response: Response) => {
    await requireTeamAdmin(request);
    const stay = await findStay(request.params.quoteRef);
    if (!isRecord(request.body)) throw new HttpError(400, 'An expense JSON body is required.');
    const description = requiredString(request.body.description, 'Expense description', 500);
    const amountZar = Number(request.body.amountZar);
    if (!Number.isFinite(amountZar) || amountZar <= 0 || amountZar > 1_000_000) {
      throw new HttpError(400, 'Enter an expense amount greater than R0 and no more than R1,000,000.');
    }
    const loggedBy = requiredString(request.body.loggedBy, 'Team member name', 160);
    const { data, error } = await getSupabaseAdmin()
      .from('incidentals')
      .insert({
        stay_id: stay.id,
        description,
        amount_zar: amountZar,
        logged_by: loggedBy,
      })
      .select('*')
      .single();
    if (error || !data) {
      console.error('Incidental insert failed:', error?.message);
      throw new HttpError(502, 'The expense could not be logged. Please try again.');
    }
    const item = normalizeIncidentals([data as Record<string, unknown>])[0];
    response.status(201).json({ expense: item });
  })
);

export default router;
