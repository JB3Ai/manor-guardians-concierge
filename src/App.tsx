import { useRef, useState } from 'react';
import { ClientPortalSection } from './components/ClientPortalSection';
import { ClientPortalShowcase } from './components/ClientPortalShowcase';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { PromiseTimeline } from './components/PromiseTimeline';
import { QuoteBookingSection } from './components/QuoteBookingSection';
import { ServicesGrid } from './components/ServicesGrid';
import { TestimonialsSection } from './components/TestimonialsSection';
import { WhoWeAreSection } from './components/WhoWeAreSection';
import { PRETORIA_SUBURBS } from './data/services';
import { BespokeService, QuoteInput } from './types/concierge';

const DEFAULT_QUOTE_INPUT: QuoteInput = {
  stayContext: 'away-travel',
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
  selectedDayTrips: [],
  requestedSpecialistServices: [],
  consultationPreference: 'in-home-meet-greet',
  maintenanceNotes: '',
};

export default function App() {
  const [activeView, setActiveView] = useState<'landing' | 'portal'>('landing');
  const [portalInitialTab, setPortalInitialTab] = useState<'onboarding' | 'live-stay'>(
    'live-stay'
  );
  const [quoteInput, setQuoteInput] = useState<QuoteInput>(DEFAULT_QUOTE_INPUT);
  const [selectedSuburb, setSelectedSuburb] = useState<string>(PRETORIA_SUBURBS[0]);
  const startDateInputRef = useRef<HTMLInputElement>(null);

  const scrollToSection = (sectionId: string) => {
    if (activeView !== 'landing') {
      setActiveView('landing');
      window.setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenClientPortal = (initialTab: 'onboarding' | 'live-stay' = 'live-stay') => {
    setPortalInitialTab(initialTab);
    setActiveView('portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setActiveView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCalculateQuoteAndConsult = () => {
    scrollToSection('quote');
    window.setTimeout(() => {
      startDateInputRef.current?.focus({ preventScroll: true });
    }, 350);
  };

  const handleSelectSuburbForQuote = (suburbName: string) => {
    setSelectedSuburb(suburbName);
    handleCalculateQuoteAndConsult();
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
        case 'chauffeur':
          return {
            ...prev,
            airportTrips: prev.airportTrips === 0 ? 2 : prev.airportTrips,
            errandHours: prev.errandHours === 0 ? 2 : prev.errandHours,
            errandKilometers: prev.errandKilometers === 0 ? 35 : prev.errandKilometers,
          };
        case 'welcome-refresh':
          return {
            ...prev,
            includeWelcomeReset: true,
          };
        case 'specialist-staff':
          return {
            ...prev,
            requestedSpecialistServices:
              prev.requestedSpecialistServices.length === 0
                ? ['Supervised Additional Cleaners, Gardeners & Domestic Helpers']
                : prev.requestedSpecialistServices,
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

    handleCalculateQuoteAndConsult();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-[#FAF9F6]">
      <Navbar
        activeView={activeView}
        onNavigateSection={scrollToSection}
        onOpenClientPortal={() => handleOpenClientPortal('live-stay')}
      />

      <main className="flex-1">
        {activeView === 'portal' ? (
          <ClientPortalSection
            initialTab={portalInitialTab}
            onBackToOverview={handleBackToLanding}
          />
        ) : (
          <>
            <HeroSection onCalculateQuote={handleCalculateQuoteAndConsult} />
            <ServicesGrid onSelectServiceAction={handleSelectServiceAction} />
            <WhoWeAreSection onSelectSuburbForQuote={handleSelectSuburbForQuote} />
            <PromiseTimeline />
            <TestimonialsSection onRequestConsultation={handleCalculateQuoteAndConsult} />
            <QuoteBookingSection
              quoteInput={quoteInput}
              selectedSuburb={selectedSuburb}
              onChangeQuoteInput={setQuoteInput}
              startDateInputRef={startDateInputRef}
            />
            <ClientPortalShowcase onOpenPortal={handleOpenClientPortal} />
            <FaqSection onRequestConsultation={handleCalculateQuoteAndConsult} />
          </>
        )}
      </main>

      <Footer
        onNavigateSection={scrollToSection}
        onOpenClientPortal={() => handleOpenClientPortal('live-stay')}
      />
    </div>
  );
}
