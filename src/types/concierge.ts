export type ServiceId =
  | 'vip-estate-pet-care'
  | 'peak-festive-surcharge'
  | 'airport-chauffeur'
  | 'concierge-driving'
  | 'welcome-home-reset'
  | 'property-maintenance';

export type BaseCareTier = 'vip-24-7' | 'daily-drop-in';

export interface BespokeService {
  id: ServiceId;
  indexNumber: string;
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
    | 'airport'
    | 'errands'
    | 'welcome-reset'
    | 'maintenance';
}

export interface QuoteInput {
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
  welcomeResetSubtotal: number;
  preArrivalMaintenanceSubtotal: number;
  conciergeDrivingSubtotal: number;
  subtotalBeforePeak: number;
  estimatedTotal: number;
  depositAmount: number;
  balanceOnArrival: number;
  hasFestiveDates: boolean;
}

export interface ClientContactDetails {
  fullName: string;
  suburbOrEstate: string;
  whatsappPhone: string;
  email: string;
  specialInstructions: string;
}

/* ---------- Client Portal: Tab 1 (Estate & Pet Onboarding) ---------- */

export interface PetOnboardingProfile {
  id: string;
  name: string;
  breed: string;
  feedingScheduleAndPortions: string;
  medicationsOrAllergies: string;
  behavioralNotes: string;
  primaryVetContact: string;
}

export interface EstateOnboardingDossier {
  estateNameAndAddress: string;
  gateAccessProcedure: string;
  armedResponseCompanyAndPassword: string;
  waterShutoffAndDbLocations: string;
  houseQuirks: string;
  pets: PetOnboardingProfile[];
  expectedReturnDateTime: string;
  fridgeGroceryList: string;
  laundryAndCurtainInstructions: string;
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
}

export interface StayBillingLedger {
  referenceCode: string;
  totalBookingQuotedZar: number;
  initialDepositPaidZar: number;
  remainingStayBalanceZar: number;
  incidentals: IncidentalExpenseItem[];
}

export interface EstatePortalSession {
  estateName: string;
  referenceCode: string;
  datesLabel: string;
  leadGuardian: string;
  teamMembers: string[];
  petsSummary: string;
  nextUpdateTime: string;
  resetScheduled: string;
  updates: PortalDailyUpdate[];
  billing: StayBillingLedger;
}
