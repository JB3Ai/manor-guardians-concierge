import { useRef, useState } from 'react';
import { ClientPortalSection } from './components/ClientPortalSection';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { PromiseTimeline } from './components/PromiseTimeline';
import { QuoteBookingSection } from './components/QuoteBookingSection';
import { ServicesGrid } from './components/ServicesGrid';
import { BespokeService, QuoteInput } from './types/concierge';

const DEFAULT_QUOTE_INPUT: QuoteInput = {
  baseTier: 'vip-24-7',
  checkInDate: '2026-12-20',
  checkOutDate: '2026-12-28',
  petCount: 2,
  petSpeciesSummary: '2 Dogs',
  airportTrips: 2,
  includeWelcomeReset: true,
  includePreArrivalMaintenance: false,
  errandHours: 0,
  errandKilometers: 0,
  maintenanceNotes: '',
};

export default function App() {
  const [quoteInput, setQuoteInput] = useState<QuoteInput>(DEFAULT_QUOTE_INPUT);
  const startDateInputRef = useRef<HTMLInputElement>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCalculateHolidayQuote = () => {
    scrollToSection('quote');
    window.setTimeout(() => {
      startDateInputRef.current?.focus({ preventScroll: true });
    }, 350);
  };

  const handleSelectServiceAction = (service: BespokeService) => {
    setQuoteInput((prev) => {
      switch (service.quoteActionType) {
        case 'base-care':
          return {
            ...prev,
            baseTier: 'vip-24-7',
          };
        case 'festive-info':
          return {
            ...prev,
            checkInDate: '2026-12-20',
            checkOutDate: '2027-01-02',
          };
        case 'airport':
          return {
            ...prev,
            airportTrips: prev.airportTrips === 0 ? 2 : prev.airportTrips,
          };
        case 'errands':
          return {
            ...prev,
            errandHours: prev.errandHours === 0 ? 2 : prev.errandHours,
            errandKilometers: prev.errandKilometers === 0 ? 35 : prev.errandKilometers,
          };
        case 'welcome-reset':
          return {
            ...prev,
            includeWelcomeReset: true,
          };
        case 'maintenance':
          return {
            ...prev,
            includePreArrivalMaintenance: true,
          };
        default:
          return prev;
      }
    });

    handleCalculateHolidayQuote();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-[#FAF9F6]">
      <Navbar onNavigateSection={scrollToSection} />

      <main className="flex-1">
        <HeroSection onCalculateQuote={handleCalculateHolidayQuote} />
        <ServicesGrid onSelectServiceAction={handleSelectServiceAction} />
        <PromiseTimeline />
        <QuoteBookingSection
          quoteInput={quoteInput}
          onChangeQuoteInput={setQuoteInput}
          startDateInputRef={startDateInputRef}
        />
        <ClientPortalSection />
      </main>

      <Footer onNavigateSection={scrollToSection} />
    </div>
  );
}
