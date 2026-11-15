import {
  BespokeService,
  EstateOnboardingDossier,
  EstatePortalSession,
} from '../types/concierge';

export const WHATSAPP_BASE_URL = 'https://wa.me/27000000000';

export const PRICING_RATES = {
  vipDailyRateZar: 1350,
  dailyDropInRateZar: 650,
  peakFestiveSurchargeRate: 0.25, // +25% from Dec 20 to Jan 2
  airportTransferTripZar: 450,
  conciergeDrivingHourlyZar: 250,
  conciergeDrivingPerKmZar: 8,
  welcomeHomeResetFlatZar: 600,
  preArrivalMaintenanceFlatZar: 850,
  depositPercentage: 0.5,
} as const;

export const BESPOKE_SERVICES: BespokeService[] = [
  {
    id: 'vip-estate-pet-care',
    indexNumber: '01',
    title: 'VIP 24/7 Estate & Pet Care',
    priceLabel: 'R1,350',
    billingUnit: 'per day',
    summary:
      'Dedicated live-in guardian residing on your property around the clock—maintaining pet feeding rituals, medication schedules, companionship, and active residential presence.',
    highlights: [
      '24/7 continuous on-site estate occupancy',
      'Timed 08:00 & 18:00 WhatsApp photo & video updates',
      'Alarm arming, gate access supervision & parcel intake',
    ],
    featuredImage: '/src/assets/images/service_estate_pet_care_1794747601774.jpg',
    featuredImageAlt: 'Golden retriever resting calmly on a travertine estate terrace in Pretoria',
    actionLabel: 'Calculate Stay Dates',
    quoteActionType: 'base-care',
  },
  {
    id: 'welcome-home-reset',
    indexNumber: '02',
    title: '“Welcome Home” Reset',
    priceLabel: 'R600',
    billingUnit: 'flat fee',
    summary:
      'Return from long-haul travel to a spotless residence. Executed on the morning of your arrival so every surface, bed, and refrigerator is ready for immediate rest.',
    highlights: [
      'Full residence deep clean prior to arrival',
      'Freshly laundered & pressed bedroom linens',
      'Essential groceries, milk, bread & chilled beverages stocked',
    ],
    featuredImage: '/src/assets/images/service_welcome_reset_1794747602927.jpg',
    featuredImageAlt: 'Luxury alabaster marble kitchen island prepared with fresh linen and protea',
    actionLabel: 'Add Reset to Quote',
    quoteActionType: 'welcome-reset',
  },
  {
    id: 'peak-festive-surcharge',
    indexNumber: '03',
    title: 'Peak Festive Surcharge',
    priceLabel: '+25%',
    billingUnit: 'Dec 20 – Jan 2',
    summary:
      'High-demand holiday guardianship coverage across Christmas and New Year’s Eve, guaranteeing uninterrupted live-in staffing throughout Pretoria’s peak travel window.',
    highlights: [
      'Applies automatically only to nights between Dec 20 and Jan 2',
      'R1,687.50/day during peak festive dates',
      'Fireworks calming protocols for sensitive dogs & cats',
    ],
    actionLabel: 'Preview December Dates',
    quoteActionType: 'festive-info',
  },
  {
    id: 'airport-chauffeur',
    indexNumber: '04',
    title: 'Airport Chauffeur & Terminal Transfer',
    priceLabel: 'R450',
    billingUnit: 'per trip',
    summary:
      'Punctual door-to-terminal private transfers between your Pretoria estate and OR Tambo International or Lanseria Airport—eliminating long-stay parking risk.',
    highlights: [
      'Private executive vehicle or owner-vehicle transfer',
      'Real-time flight delay tracking for return pickups',
      'Luggage assistance & direct guardian handover',
    ],
    actionLabel: 'Add Transfers',
    quoteActionType: 'airport',
  },
  {
    id: 'concierge-driving',
    indexNumber: '05',
    title: 'Concierge Driving & Errands',
    priceLabel: 'R250 / hr',
    billingUnit: '+ R8 / km',
    summary:
      'Discreet daytime transport for veterinary appointments, grooming drop-offs, prescription collections, or specialist estate supply runs while you are abroad.',
    highlights: [
      'Vet & specialist pet grooming transport',
      'Dry cleaning, pharmacy & bespoke pantry errands',
      'GPS-logged mileage & transparent itemised receipts',
    ],
    actionLabel: 'Estimate Errand Hours',
    quoteActionType: 'errands',
  },
  {
    id: 'property-maintenance',
    indexNumber: '06',
    title: 'Property Maintenance & Upkeep',
    priceLabel: 'Included',
    billingUnit: 'in 24/7 care · or R850 pre-arrival wash',
    summary:
      'Proactive preventative care that protects high-value Pretoria homes during summer thunderstorms, power fluctuations, and extended owner absences.',
    highlights: [
      'Pool chemical balancing, skimmer & weir upkeep',
      'Garden irrigation checks & high-pressure paving wash',
      'Minor paint touch-ups, plumbing & electrical inspections',
    ],
    actionLabel: 'Add Pre-Arrival Wash',
    quoteActionType: 'maintenance',
  },
];

export const PRETORIA_SUBURBS = [
  'Waterkloof',
  'Waterkloof Ridge',
  'Silver Lakes Golf Estate',
  'Mooikloof Equestrian Estate',
  'Woodhill Golf Estate',
  'Brooklyn & Menlo Park',
  'Lynnwood & Hazelwood',
  'Featherbrooke / Irene',
];

export const GUARDIAN_TEAM_MEMBERS = [
  'Hendrik van der Merwe (Lead Guardian)',
  'Thabo Mokoena (Estate & Security Specialist)',
  'Annelize Botha (Pet Concierge & Reset Lead)',
];

export const DEFAULT_ONBOARDING_DOSSIER: EstateOnboardingDossier = {
  estateNameAndAddress: '18 Rigel Avenue North, Waterkloof Ridge, Pretoria',
  gateAccessProcedure:
    'Estate biometric app pin + intercom dial *4401; security gatehouse holds pre-cleared SA ID copy.',
  armedResponseCompanyAndPassword: 'Brinant Security · Verbal code: "Jacaranda 48"',
  waterShutoffAndDbLocations:
    'Main water stopcock beside northern boundary wall; primary DB & Sunsynk 16kW inverter in double garage alcove.',
  houseQuirks:
    'Pool pump runs 08:00–14:00 daily; Zone 4 (patio beam) stays bypassed while dogs are outside.',
  pets: [
    {
      id: 'pet-1',
      name: 'Zuri',
      breed: 'Rhodesian Ridgeback (Female, 4 yrs)',
      feedingScheduleAndPortions: '07:00 & 17:30 — 320g Acana Adult + 1 tbsp salmon oil',
      medicationsOrAllergies: 'None; sensitive to poultry treats',
      behavioralNotes: 'Gentle indoors; prefers closed study curtains during summer thunder',
      primaryVetContact: 'Waterkloof Veterinary Clinic · +27 12 346 0000',
    },
    {
      id: 'pet-2',
      name: 'Rocco',
      breed: 'Rhodesian Ridgeback (Male, 7 yrs)',
      feedingScheduleAndPortions: '07:00 & 17:30 — 350g Acana Adult',
      medicationsOrAllergies: '1 × Mobiflex joint chew with morning meal',
      behavioralNotes: 'Walks calmly on harness; loves veranda sunbathing after morning walk',
      primaryVetContact: 'Waterkloof Veterinary Clinic · +27 12 346 0000',
    },
  ],
  expectedReturnDateTime: '2026-12-28T15:30',
  fridgeGroceryList:
    'Woolworths Ayrshire Full Cream Milk (2L), Artisan Sourdough Loaf, salted farm butter, Lavazza Qualità Oro beans, 6 free-range eggs, still spring water.',
  laundryAndCurtainInstructions:
    'Strip & press master suite white percale linen on return morning; open living room shears at 08:00 and set master AC to 21°C two hours before arrival.',
};

export const SAMPLE_PORTAL_SESSION: EstatePortalSession = {
  estateName: 'Waterkloof Ridge Residence',
  referenceCode: 'MG-2026-WKR',
  datesLabel: '20 Dec 2026 – 28 Dec 2026',
  leadGuardian: 'Hendrik van der Merwe (Lead Guardian)',
  teamMembers: GUARDIAN_TEAM_MEMBERS,
  petsSummary: '2 × Rhodesian Ridgebacks (Zuri & Rocco)',
  nextUpdateTime: '08:00 AM & 05:30 PM SAST Daily',
  resetScheduled: '28 Dec 2026 · 09:30 AM SAST',
  updates: [
    {
      id: 'upd-3',
      slotTitle: '08:00 AM Morning Check-In',
      dateLabel: '23 Dec 2026',
      timestampSast: '08:02 AM SAST',
      guardianName: 'Hendrik van der Merwe (Lead Guardian)',
      statuses: {
        dogsFedWalked: true,
        poolAndGarden: true,
        securityAndPowerOn: true,
      },
      caretakerNotes:
        'Zuri and Rocco completed their 45-minute estate perimeter walk before the morning heat. Rocco took his Mobiflex chew with breakfast. Pool weir cleared and solar inverter sitting at 98% battery.',
      photoUrl: '/src/assets/images/portal_daily_update_pet_1794747603008.jpg',
      photoAlt:
        'Two Rhodesian Ridgebacks relaxing on a shaded Pretoria sandstone patio beside the pool',
    },
    {
      id: 'upd-2',
      slotTitle: '05:30 PM Evening Update',
      dateLabel: '22 Dec 2026',
      timestampSast: '05:34 PM SAST',
      guardianName: 'Thabo Mokoena (Estate & Security Specialist)',
      statuses: {
        dogsFedWalked: true,
        poolAndGarden: true,
        securityAndPowerOn: true,
      },
      caretakerNotes:
        'Brief afternoon Pretoria thunderstorm passed at 16:40. Outdoor cushions were stowed ahead of rain, storm drains verified clear, dogs settled indoors with evening meal, and perimeter beams armed.',
    },
    {
      id: 'upd-1',
      slotTitle: '08:00 AM Morning Check-In',
      dateLabel: '22 Dec 2026',
      timestampSast: '08:00 AM SAST',
      guardianName: 'Annelize Botha (Pet Concierge & Reset Lead)',
      statuses: {
        dogsFedWalked: true,
        poolAndGarden: true,
        securityAndPowerOn: true,
      },
      caretakerNotes:
        'Picked up fresh pool chlorine from Poolrite Waterkloof and balanced pH to 7.4. Both Ridgebacks hydrated and rested calmly on the travertine veranda.',
      photoUrl: '/src/assets/images/service_estate_pet_care_1794747601774.jpg',
      photoAlt: 'Calm dog resting on warm travertine patio beside timber estate doors',
    },
  ],
  billing: {
    referenceCode: 'MG-2026-WKR',
    totalBookingQuotedZar: 15000,
    initialDepositPaidZar: 7500,
    remainingStayBalanceZar: 7500,
    incidentals: [
      {
        id: 'inc-1',
        dateLabel: '22 Dec 2026',
        description: 'Pool Chlorine (Poolrite Waterkloof · 4kg Granular)',
        loggedBy: 'Annelize Botha',
        amountZar: 220,
      },
      {
        id: 'inc-2',
        dateLabel: '23 Dec 2026',
        description: 'Woolworths Welcome Milk & Bread',
        loggedBy: 'Hendrik van der Merwe',
        amountZar: 145,
      },
    ],
  },
};
