import { useState } from 'react';
import { ClipboardList, Radio } from 'lucide-react';
import {
  DEFAULT_ONBOARDING_DOSSIER,
  SAMPLE_PORTAL_SESSION,
} from '../data/services';
import {
  IncidentalExpenseItem,
  PortalDailyUpdate,
  ResidenceOnboardingDossier,
  StayBillingLedger,
} from '../types/concierge';
import { LiveStayUpdatesTab } from './portal/LiveStayUpdatesTab';
import { OnboardingFormTab } from './portal/OnboardingFormTab';

type ClientPortalTab = 'onboarding' | 'live-stay';

export function ClientPortalSection() {
  const [activeTab, setActiveTab] = useState<ClientPortalTab>('live-stay');
  const [dossier, setDossier] = useState<ResidenceOnboardingDossier>(DEFAULT_ONBOARDING_DOSSIER);
  const [updates, setUpdates] = useState<PortalDailyUpdate[]>(SAMPLE_PORTAL_SESSION.updates);
  const [billing, setBilling] = useState<StayBillingLedger>(SAMPLE_PORTAL_SESSION.billing);

  const handleAddUpdate = (newUpdate: PortalDailyUpdate) => {
    setUpdates((prev) => [newUpdate, ...prev]);
  };

  const handleAddIncidental = (expense: IncidentalExpenseItem) => {
    setBilling((prev) => ({
      ...prev,
      incidentals: [...prev.incidentals, expense],
    }));
  };

  return (
    <section
      id="portal"
      className="no-print bg-[#121212] text-[#FAF9F6] py-16 sm:py-24 border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header + Two Primary Portal Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-white/10">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-medium tracking-[0.14em] uppercase text-[#C5A059] mb-3">
              Client Portal
            </p>
            <h2
              className="font-display font-medium text-[#FAF9F6] leading-[1.12] tracking-tight"
              style={{
                fontSize: 'clamp(1.85rem, 3.2vw, 2.85rem)',
                textWrap: 'balance',
              }}
            >
              Digital Residence Onboarding &amp; Live Stay Concierge Feed
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Client portal sections"
            className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 bg-[#1A1A1A] border border-white/10 rounded-sm self-start lg:self-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'onboarding'}
              onClick={() => setActiveTab('onboarding')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'onboarding'
                  ? 'bg-[#C5A059] text-[#121212] font-semibold'
                  : 'text-[#FAF9F6]/75 hover:text-[#FAF9F6]'
              }`}
            >
              <ClipboardList className="w-4 h-4" aria-hidden="true" />
              <span>1. Residence &amp; Pet Onboarding</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'live-stay'}
              onClick={() => setActiveTab('live-stay')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'live-stay'
                  ? 'bg-[#C5A059] text-[#121212] font-semibold'
                  : 'text-[#FAF9F6]/75 hover:text-[#FAF9F6]'
              }`}
            >
              <Radio className="w-4 h-4" aria-hidden="true" />
              <span>2. Live Stay &amp; Daily Updates</span>
            </button>
          </div>
        </div>

        {/* Active Tab View */}
        {activeTab === 'onboarding' ? (
          <OnboardingFormTab
            dossier={dossier}
            onSaveDossier={setDossier}
            onSwitchToLiveStay={() => setActiveTab('live-stay')}
          />
        ) : (
          <LiveStayUpdatesTab
            referenceCode={SAMPLE_PORTAL_SESSION.referenceCode}
            datesLabel={SAMPLE_PORTAL_SESSION.datesLabel}
            dossier={dossier}
            updates={updates}
            billing={billing}
            onAddUpdate={handleAddUpdate}
            onAddIncidental={handleAddIncidental}
          />
        )}
      </div>
    </section>
  );
}
