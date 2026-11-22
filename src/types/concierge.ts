export type ServiceId =
  | 'core-residence-pet-care'
  | 'welcome-home-refresh'
  | 'trusted-chauffeur-day-trips'
  | 'vetted-family-staff-specialist'
  | 'peak-festive-surcharge'
  | 'pre-arrival-maintenance';

export type BaseCareTier = 'vip-24-7' | 'daily-drop-in';
export type StayContextMode = 'away-travel' | 'at-home-support';
export type ConsultationPreference = 'in-home-meet-greet' | 'online-video';

export interface BespokeService {
  id: ServiceId;
  indexNumber: string;
  categoryLabel: string;
  title: string;
  priceLabel: string;
  billingUnit: string;
  summary: string;
  highlights: string[];
  featuredImage?: string;
  featuredImageAlt?: string;
  actionLabel: string;
  quoteActionType:
    | 'base-care'
    | 'festive-info'
    | 'chauffeur'
    | 'welcome-refresh'
    | 'specialist-staff'
    | 'maintenance';
}

export interface PretoriaSuburbCoverage {
  name: string;
  responseEta: string;
  highlights: string;
  mapX: number; // SVG percentage 0-100
  mapY: number; // SVG percentage 0-100
}

export interface QuoteInput {
  stayContext: StayContextMode;
  baseTier: BaseCareTier;
  checkInDate: string;
  checkOutDate: string;
  petCount: number;
  petSpeciesSummary: string;
  airportTrips: number;
  includeWelcomeReset: boolean;
  includePreArrivalMaintenance: boolean;
  errandHours: number;
  errandKilometers: number;
  selectedDayTrips: string[];
  requestedSpecialistServices: string[];
  consultationPreference: ConsultationPreference;
  maintenanceNotes: string;
}

export interface QuoteBreakdown {
  baseTier: BaseCareTier;
  baseTierLabel: string;
  dailyRateZar: number;
  totalDays: number;
  standardDays: number;
  peakFestiveDays: number;
  baseCareSubtotal: number;
  peakSurchargeSubtotal: number;
  airportTransferSubtotal: number;
  dayTripSubtotal: number;
  welcomeResetSubtotal: number;
  preArrivalMaintenanceSubtotal: number;
  conciergeDrivingSubtotal: number;
  subtotalBeforePeak: number;
  estimatedTotal: number;
  indicativeDepositAmount: number;
  balanceOnCompletion: number;
  hasFestiveDates: boolean;
  hasCustomQuotedItems: boolean;
}

export interface ClientContactDetails {
  fullName: string;
  suburbOrResidence: string;
  whatsappPhone: string;
  email: string;
  specialInstructions: string;
}

/* ---------- Client Portal: Tab 1 (Residence & Pet Onboarding) ---------- */

export interface PetOnboardingProfile {
  id: string;
  name: string;
  breed: string;
  feedingScheduleAndPortions: string;
  medicationsOrAllergies: string;
  behavioralNotes: string;
  primaryVetContact: string;
}

export interface EmergencyContactPerson {
  fullName: string;
  relationship: string;
  phone: string;
  email: string;
}

export interface EmergencyProtocolDetails {
  primaryContact: EmergencyContactPerson;
  secondaryContact: EmergencyContactPerson;
  urgentNote: string;
}

export interface ResidenceOnboardingDossier {
  residenceNameAndAddress: string;
  gateAccessProcedure: string;
  armedResponseCompanyAndPassword: string;
  waterShutoffAndDbLocations: string;
  houseQuirks: string;
  pets: PetOnboardingProfile[];
  expectedReturnDateTime: string;
  fridgeGroceryList: string;
  laundryAndCurtainInstructions: string;
  emergencyProtocol: EmergencyProtocolDetails;
  savedAtIso?: string;
  dossierId?: string;
}

/* ---------- Client Portal: Tab 2 (Live Stay & Daily Updates) ---------- */

export interface StayStatusChecks {
  dogsFedWalked: boolean;
  poolAndGarden: boolean;
  securityAndPowerOn: boolean;
}

export interface PortalDailyUpdate {
  id: string;
  slotTitle: string;
  dateLabel: string;
  timestampSast: string;
  guardianName: string;
  statuses: StayStatusChecks;
  caretakerNotes: string;
  photoUrl?: string;
  photoAlt?: string;
}

export interface IncidentalExpenseItem {
  id: string;
  dateLabel: string;
  description: string;
  loggedBy: string;
  amountZar: number;
  receiptUrl?: string;
}

export interface StayBillingLedger {
  referenceCode: string;
  totalBookingQuotedZar: number;
  initialDepositPaidZar: number;
  remainingStayBalanceZar: number;
  incidentals: IncidentalExpenseItem[];
}

export interface ResidencePortalSession {
  residenceName: string;
  referenceCode: string;
  datesLabel: string;
  status?: string;
  leadGuardian: string;
  teamMembers: string[];
  petsSummary: string;
  nextUpdateTime: string;
  resetScheduled: string;
  updates: PortalDailyUpdate[];
  billing: StayBillingLedger;
}

export interface ResidencePortalData {
  session: ResidencePortalSession;
  dossier: ResidenceOnboardingDossier;
}
