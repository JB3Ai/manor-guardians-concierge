import { PRICING_RATES } from '../data/pricing';
import { QuoteBreakdown, QuoteInput } from '../types/concierge';

export function isPeakFestiveNight(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  return (month === 11 && day >= 20) || (month === 0 && day <= 2);
}

export function calculateQuoteBreakdown(input: QuoteInput): QuoteBreakdown {
  const start = new Date(`${input.checkInDate}T00:00:00`);
  const end = new Date(`${input.checkOutDate}T00:00:00`);

  let standardDays = 0;
  let peakFestiveDays = 0;

  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
    const cursor = new Date(start);
    let safety = 0;
    while (cursor < end && safety < 180) {
      if (isPeakFestiveNight(cursor)) {
        peakFestiveDays += 1;
      } else {
        standardDays += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
      safety += 1;
    }
  }

  const totalDays = standardDays + peakFestiveDays;
  const dailyRateZar =
    input.baseTier === 'vip-24-7'
      ? PRICING_RATES.vipDailyRateZar
      : PRICING_RATES.dailyDropInRateZar;
  const baseTierLabel =
    input.baseTier === 'vip-24-7'
      ? '24/7 Live-In Residence & Pet Care'
      : 'Daily Check-In Visits';

  const baseCareSubtotal = totalDays * dailyRateZar;
  const peakSurchargeSubtotal =
    peakFestiveDays * dailyRateZar * PRICING_RATES.peakFestiveSurchargeRate;
  const airportTransferSubtotal =
    Math.max(0, input.airportTrips) * PRICING_RATES.airportTransferTripZar;
  const dayTripSubtotal = input.selectedDayTrips.length * PRICING_RATES.dayTripPerTrip;
  const welcomeResetSubtotal = input.includeWelcomeReset
    ? PRICING_RATES.welcomeHomeResetFlatZar
    : 0;
  const preArrivalMaintenanceSubtotal = input.includePreArrivalMaintenance
    ? PRICING_RATES.preArrivalMaintenanceFlatZar
    : 0;
  const conciergeDrivingSubtotal =
    Math.max(0, input.errandHours) * PRICING_RATES.conciergeDrivingHourlyZar +
    Math.max(0, input.errandKilometers) * PRICING_RATES.conciergeDrivingPerKmZar;

  const subtotalBeforePeak =
    baseCareSubtotal +
    airportTransferSubtotal +
    dayTripSubtotal +
    welcomeResetSubtotal +
    preArrivalMaintenanceSubtotal +
    conciergeDrivingSubtotal;
  const estimatedTotal = subtotalBeforePeak + peakSurchargeSubtotal;
  const indicativeDepositAmount = estimatedTotal * PRICING_RATES.depositPercentage;
  const balanceOnCompletion = estimatedTotal - indicativeDepositAmount;

  return {
    baseTier: input.baseTier,
    baseTierLabel,
    dailyRateZar,
    totalDays,
    standardDays,
    peakFestiveDays,
    baseCareSubtotal,
    peakSurchargeSubtotal,
    airportTransferSubtotal,
    dayTripSubtotal,
    welcomeResetSubtotal,
    preArrivalMaintenanceSubtotal,
    conciergeDrivingSubtotal,
    subtotalBeforePeak,
    estimatedTotal,
    indicativeDepositAmount,
    balanceOnCompletion,
    hasFestiveDates: peakFestiveDays > 0,
    hasCustomQuotedItems: input.requestedSpecialistServices.length > 0,
  };
}
