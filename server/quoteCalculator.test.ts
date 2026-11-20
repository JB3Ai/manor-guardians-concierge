import assert from 'node:assert/strict';
import test from 'node:test';
import { QuoteInput } from '../src/types/concierge';
import { calculateQuoteBreakdown } from '../src/services/quoteCalculator';

function makeQuote(overrides: Partial<QuoteInput> = {}): QuoteInput {
  return {
    stayContext: 'away-travel',
    baseTier: 'vip-24-7',
    checkInDate: '2026-03-01',
    checkOutDate: '2026-03-02',
    petCount: 1,
    petSpeciesSummary: 'Dog',
    airportTrips: 0,
    includeWelcomeReset: false,
    includePreArrivalMaintenance: false,
    errandHours: 0,
    errandKilometers: 0,
    selectedDayTrips: [],
    requestedSpecialistServices: [],
    consultationPreference: 'online-video',
    maintenanceNotes: '',
    ...overrides,
  };
}

test('day trips are included in the server-reusable quote total at R1,200 each', () => {
  const breakdown = calculateQuoteBreakdown(
    makeQuote({ selectedDayTrips: ['Cullinan', 'Irene'] })
  );
  assert.equal(breakdown.dayTripSubtotal, 2400);
  assert.equal(breakdown.estimatedTotal, 3750);
  assert.equal(breakdown.hasCustomQuotedItems, false);
});

test('festive surcharge covers nights from December 20 through January 2', () => {
  const breakdown = calculateQuoteBreakdown(
    makeQuote({ checkInDate: '2026-12-20', checkOutDate: '2027-01-03' })
  );
  assert.equal(breakdown.peakFestiveDays, 14);
  assert.equal(breakdown.peakSurchargeSubtotal, 4725);
});
