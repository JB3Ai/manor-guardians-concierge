import {
  BespokeService,
  PretoriaSuburbCoverage,
  ResidenceOnboardingDossier,
  ResidencePortalSession,
} from '../types/concierge';
import { PRICING_RATES } from './pricing';

export { PRICING_RATES } from './pricing';

export const BRAND_NAME = 'Pretoria East Home & Pet Concierge';
const whatsappBusinessNumber =
  (import.meta.env.VITE_WHATSAPP_BUSINESS_NUMBER || '').replace(/\D/g, '') || '27000000000';
export const WHATSAPP_BASE_URL = `https://wa.me/${whatsappBusinessNumber}`;

export const CURATED_DAY_TRIPS = [
  'Cullinan Diamond Mine Tour',
  'Irene Dairy Farm Family Visit',
  'Acrobranch Pretoria East Treetop Adventure',
  'Freedom Park & Heritage Walk',
  'Voortrekker Monument Guided Tour',
] as const;

export const SPECIALIST_ON_REQUEST_SERVICES = [
  'Supervised Additional Cleaners, Gardeners & Domestic Helpers',
  'Scheduled Security & Perimeter Property Checks',
  'Pick-Up & Delivery Laundry, Ironing, Curtain & Carpet Cleaning',
  'Rubbish Removal & Full Deep-Cleaning Resets',
] as const;

export const BESPOKE_SERVICES: BespokeService[] = [
  {
    id: 'core-residence-pet-care',
    indexNumber: '01',
    categoryLabel: 'Core Residence & Pet Care',
    title: '24/7 Live-In Presence or Daily Home Check-Ins',
    priceLabel: 'R1,350',
    billingUnit: 'per day (24/7) · R650/day drop-in',
    summary:
      'Attentive care for your home and animals, whether you are flying abroad or staying home and simply want to offload December chores, pet walks, and hosting upkeep.',
    highlights: [
      'Dog feeding, supervised playtime, watering plants & taking municipal bins out',
      'Window washing, pool chemical upkeep & basic handyman home maintenance',
      'Timed 08:00 & 18:00 WhatsApp photo & wellness updates',
    ],
    featuredImage: '/images/service_estate_pet_care_1794747601774.jpg',
    featuredImageAlt:
      'Golden retriever resting calmly on a sunlit Pretoria East residence veranda',
    actionLabel: 'Estimate Stay or Home Support',
    quoteActionType: 'base-care',
  },
  {
    id: 'welcome-home-refresh',
    indexNumber: '02',
    categoryLabel: '“Welcome Home” Refresh',
    title: 'Fresh Pantry, Pressed Linen & Flower Arrangements',
    priceLabel: 'R600',
    billingUnit: 'flat fee',
    summary:
      'Step through your front door, or prepare for visiting family, to a calm, spotless home with chilled essentials and fresh South African blooms already arranged.',
    highlights: [
      'Fresh artisan bread, milk, coffee, butter & chilled pantry staples stocked',
      'Fresh protea or seasonal flower arrangements placed in living spaces',
      'Full surface polish & freshly laundered, pressed bedroom linens',
    ],
    featuredImage: '/images/service_welcome_reset_1794747602927.jpg',
    featuredImageAlt:
      'Luxury kitchen island with fresh protea flowers, crystal carafe and pressed white linen',
    actionLabel: 'Add Welcome Refresh',
    quoteActionType: 'welcome-refresh',
  },
  {
    id: 'trusted-chauffeur-day-trips',
    indexNumber: '03',
    categoryLabel: 'Trusted Chauffeur & Day Trips',
    title: 'Private Transport, School Runs & Curated Tours',
    priceLabel: 'R450 airport · R1,200 day trip',
    billingUnit: 'airport · R250/hr + R8/km on-demand',
    summary:
      'Safe, personally trusted Uber-style private transport for school runs, errands, and OR Tambo/Lanseria transfers, plus guided local day trips for kids or visiting family.',
    highlights: [
      'Airport transfers (R450/trip) & reliable on-demand chauffeur rides',
      'Curated day trips: Cullinan Diamond Mine, Irene Farm & Acrobranch',
      'Heritage outings to Freedom Park & Voortrekker Monument',
    ],
    actionLabel: 'Plan Chauffeur & Day Trips',
    quoteActionType: 'chauffeur',
  },
  {
    id: 'vetted-family-staff-specialist',
    indexNumber: '04',
    categoryLabel: 'Vetted Family Staff & Specialist Services',
    title: 'Supervised Helpers, Laundry, Carpets & Deep Resets',
    priceLabel: 'Quoted',
    billingUnit: 'on request after consultation',
    summary:
      'Need extra hands before hosting or after a busy holiday? Our personally vetted family network is supervised on-site by us so you never manage contractors alone.',
    highlights: [
      'Supervised cleaners, gardeners, domestic helpers & security checks',
      'Pick-up & delivery laundry, ironing, curtain & carpet cleaning',
      'Rubbish removal & thorough deep-cleaning home resets',
    ],
    actionLabel: 'Include On-Request Services',
    quoteActionType: 'specialist-staff',
  },
  {
    id: 'peak-festive-surcharge',
    indexNumber: '05',
    categoryLabel: 'Peak Holiday Coverage',
    title: 'Peak Festive Window (Dec 20 to Jan 2)',
    priceLabel: '+25%',
    billingUnit: 'Dec 20 to Jan 2 dates only',
    summary:
      'Guaranteed uninterrupted family team availability across Christmas and New Year’s Eve, including New Year fireworks calming protocols for dogs.',
    highlights: [
      'Automatically calculated only on nights between Dec 20 and Jan 2',
      'Available for both away-from-home and at-home festive support',
      'Free meet-and-greet vetting required prior to confirmation',
    ],
    actionLabel: 'Preview Festive Dates',
    quoteActionType: 'festive-info',
  },
  {
    id: 'pre-arrival-maintenance',
    indexNumber: '06',
    categoryLabel: 'Exterior & Home Upkeep',
    title: 'Pre-Arrival Power Wash & Minor Maintenance',
    priceLabel: 'R850',
    billingUnit: 'flat project add-on',
    summary:
      'High-pressure travertine terrace and driveway wash, gutter clearing after Highveld storms, window detailing, and minor plumbing or handyman touch-ups.',
    highlights: [
      'Patio, pool surround & driveway power washing',
      'Exterior window washing & storm drain clearing',
      'Basic handyman fixture & irrigation timer checks',
    ],
    actionLabel: 'Add Power Wash & Upkeep',
    quoteActionType: 'maintenance',
  },
];

export const PRETORIA_EAST_COVERAGE: PretoriaSuburbCoverage[] = [
  {
    name: 'Waterkloof',
    responseEta: '10-15 min arrival',
    highlights: 'Inside red boundary · Ambassadors’ Mile residences, ridge homes & gardens',
    mapX: 16,
    mapY: 18,
  },
  {
    name: 'Menlo Park',
    responseEta: '8-12 min arrival',
    highlights: 'Inside red boundary · Leafy family homes near Hazelwood & schools',
    mapX: 22,
    mapY: 10,
  },
  {
    name: 'Lynnwood',
    responseEta: '8-12 min arrival',
    highlights: 'Inside red boundary · Boomed avenues, Lynnwood Ridge & Struben Dam',
    mapX: 24,
    mapY: 6,
  },
  {
    name: 'Faerie Glen',
    responseEta: '5-10 min arrival',
    highlights: 'Inside red boundary · Central Pretoria East base & hillside properties',
    mapX: 48,
    mapY: 24,
  },
  {
    name: 'Garsfontein',
    responseEta: '6-10 min arrival',
    highlights: 'Inside red boundary · Established family streets & school-run corridors',
    mapX: 42,
    mapY: 36,
  },
  {
    name: 'Silver Lakes',
    responseEta: '12-18 min arrival',
    highlights: 'Inside red boundary · Golf & wildlife residences along the N4 corridor',
    mapX: 74,
    mapY: 12,
  },
  {
    name: 'Moreleta Park',
    responseEta: '8-12 min arrival',
    highlights: 'Inside red boundary · Family homes bordering Moreleta Kloof Reserve',
    mapX: 36,
    mapY: 64,
  },
  {
    name: 'Mooikloof',
    responseEta: '10-16 min arrival',
    highlights: 'Inside red boundary · Mooikloof & Mooikloof Ridge spacious properties',
    mapX: 58,
    mapY: 68,
  },
  {
    name: 'Erasmuskloof',
    responseEta: '10-15 min arrival',
    highlights: 'Inside red boundary · Convenient N1/R21 access & Kloof Hospital precinct',
    mapX: 22,
    mapY: 50,
  },
  {
    name: 'Monument Park',
    responseEta: '12-16 min arrival',
    highlights: 'Inside red boundary · Quiet tree-lined avenues with quick R21 access',
    mapX: 10,
    mapY: 40,
  },
];

export const PRETORIA_SUBURBS = [
  ...PRETORIA_EAST_COVERAGE.map((s) => s.name),
  'Just Outside Boundary (Custom Travel Rate)',
];

export const CARE_TEAM_MEMBERS = [
  'Nadia & Family Team Lead (Pretoria East)',
  'Thabo Mokoena (Chauffeur & Residence Security)',
  'Annelize Botha (Pet Concierge & Welcome Refresh)',
];

export const DEFAULT_ONBOARDING_DOSSIER: ResidenceOnboardingDossier = {
  residenceNameAndAddress: '18 Rigel Avenue North, Waterkloof, Pretoria East',
  gateAccessProcedure:
    'Boom gate / intercom dial *4401; security guardhouse holds pre-cleared SA ID copy for our family team.',
  armedResponseCompanyAndPassword: 'Brinant Security · Verbal code: "Jacaranda 48"',
  waterShutoffAndDbLocations:
    'Main water stopcock beside northern boundary wall; primary DB & Sunsynk 16kW inverter in double garage alcove.',
  houseQuirks:
    'Pool pump runs 08:00-14:00 daily; Zone 4 patio beam bypassed while dogs enjoy garden playtime. Municipal bins out Thursdays 06:30.',
  pets: [
    {
      id: 'pet-1',
      name: 'Zuri',
      breed: 'Rhodesian Ridgeback (Female, 4 yrs)',
      feedingScheduleAndPortions: '07:00 & 17:30: 320g Acana Adult + 1 tbsp salmon oil',
      medicationsOrAllergies: 'None; sensitive to poultry treats',
      behavioralNotes:
        'Gentle indoors; loves ball playtime with the kids and closed curtains during summer thunder',
      primaryVetContact: 'Waterkloof Veterinary Clinic · +27 12 346 0000',
    },
    {
      id: 'pet-2',
      name: 'Rocco',
      breed: 'Rhodesian Ridgeback (Male, 7 yrs)',
      feedingScheduleAndPortions: '07:00 & 17:30: 350g Acana Adult',
      medicationsOrAllergies: '1 × Mobiflex joint chew with morning meal',
      behavioralNotes: 'Walks calmly on harness; loves veranda sunbathing after morning walk',
      primaryVetContact: 'Waterkloof Veterinary Clinic · +27 12 346 0000',
    },
  ],
  expectedReturnDateTime: '2026-12-28T15:30',
  fridgeGroceryList:
    'Woolworths Ayrshire Full Cream Milk (2L), fresh sourdough bread, salted farm butter, Lavazza Qualità Oro beans, fresh protea/seasonal flower arrangement.',
  laundryAndCurtainInstructions:
    'Press master suite white percale linen on return morning; open living room shears at 08:00 and set master AC to 21°C two hours before arrival.',
  emergencyProtocol: {
    primaryContact: {
      fullName: 'Dr. Pieter Cronjé (Homeowner)',
      relationship: 'Primary Homeowner · Travelling Mobile',
      phone: '+27 82 555 0148',
      email: 'pieter.cronje@example.co.za',
    },
    secondaryContact: {
      fullName: 'Annelie Pretorius (Local Keyholder)',
      relationship: 'Neighbour / Spare Keyholder · Waterkloof',
      phone: '+27 83 555 0192',
      email: 'annelie.keyholder@example.co.za',
    },
    urgentNote: '',
  },
};

export const SAMPLE_PORTAL_SESSION: ResidencePortalSession = {
  residenceName: 'Waterkloof Family Residence',
  referenceCode: 'PEH-2026-WKL',
  datesLabel: '20 Dec 2026 to 28 Dec 2026',
  leadGuardian: 'Pretoria East Family Team Lead',
  teamMembers: CARE_TEAM_MEMBERS,
  petsSummary: '2 × Rhodesian Ridgebacks (Zuri & Rocco)',
  nextUpdateTime: '08:00 AM & 05:30 PM SAST Daily',
  resetScheduled: '28 Dec 2026 · 09:30 AM SAST',
  updates: [
    {
      id: 'upd-3',
      slotTitle: '08:00 AM Morning Check-In',
      dateLabel: '23 Dec 2026',
      timestampSast: '08:02 AM SAST',
      guardianName: 'Nadia & Family Team Lead (Pretoria East)',
      statuses: {
        dogsFedWalked: true,
        poolAndGarden: true,
        securityAndPowerOn: true,
      },
      caretakerNotes:
        'Zuri and Rocco had a great morning garden walk and supervised ball playtime before the sun rose. Rocco took his Mobiflex chew with breakfast. Municipal bins rolled out, pool weir cleared, and solar inverter at 98%.',
      photoUrl: '/images/portal_daily_update_pet_1794747603008.jpg',
      photoAlt:
        'Two Rhodesian Ridgebacks relaxing on a shaded Pretoria sandstone patio beside the pool',
    },
    {
      id: 'upd-2',
      slotTitle: '05:30 PM Evening Update',
      dateLabel: '22 Dec 2026',
      timestampSast: '05:34 PM SAST',
      guardianName: 'Thabo Mokoena (Chauffeur & Residence Security)',
      statuses: {
        dogsFedWalked: true,
        poolAndGarden: true,
        securityAndPowerOn: true,
      },
      caretakerNotes:
        'Brief afternoon Highveld thundershower passed at 16:40. Patio cushions stowed ahead of rain, indoor plants watered, dogs settled comfortably indoors with dinner, and perimeter beams armed.',
    },
    {
      id: 'upd-1',
      slotTitle: '08:00 AM Morning Check-In',
      dateLabel: '22 Dec 2026',
      timestampSast: '08:00 AM SAST',
      guardianName: 'Annelize Botha (Pet Concierge & Welcome Refresh)',
      statuses: {
        dogsFedWalked: true,
        poolAndGarden: true,
        securityAndPowerOn: true,
      },
      caretakerNotes:
        'Picked up fresh pool chlorine from Poolrite Waterkloof and balanced pH to 7.4. Both Ridgebacks hydrated and relaxed calmly on the travertine veranda.',
      photoUrl: '/images/service_estate_pet_care_1794747601774.jpg',
      photoAlt: 'Calm dog resting on warm travertine patio beside timber residence doors',
    },
  ],
  billing: {
    referenceCode: 'PEH-2026-WKL',
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
        description: 'Woolworths Welcome Milk, Bread & Fresh Flowers',
        loggedBy: 'Nadia Team Lead',
        amountZar: 245,
      },
    ],
  },
};
