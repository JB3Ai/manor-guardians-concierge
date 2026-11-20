import { FormEvent, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { ArrowLeft, ClipboardList, LogOut, Radio, UserCheck } from 'lucide-react';
import {
  DEFAULT_ONBOARDING_DOSSIER,
} from '../data/services';
import {
  IncidentalExpenseItem,
  PortalDailyUpdate,
  ResidenceOnboardingDossier,
  ResidencePortalData,
  StayBillingLedger,
} from '../types/concierge';
import { fetchClientPortalSession } from '../services/conciergeApi';
import {
  getTeamAdminSession,
  signInTeamAdmin,
  signOutTeamAdmin,
} from '../services/supabaseAuth';
import { LiveStayUpdatesTab } from './portal/LiveStayUpdatesTab';
import { OnboardingFormTab } from './portal/OnboardingFormTab';

type ClientPortalTab = 'onboarding' | 'live-stay';

interface ClientPortalSectionProps {
  initialTab?: ClientPortalTab;
  initialReferenceCode?: string;
  initialPortalToken?: string;
  onBackToOverview: () => void;
}

export function ClientPortalSection({
  initialTab = 'live-stay',
  initialReferenceCode = '',
  initialPortalToken = '',
  onBackToOverview,
}: ClientPortalSectionProps) {
  const [activeTab, setActiveTab] = useState<ClientPortalTab>(initialTab);
  const [referenceCode, setReferenceCode] = useState('');
  const [portalToken, setPortalToken] = useState('');
  const [portalData, setPortalData] = useState<ResidencePortalData | null>(null);
  const [isPortalAccessRequested, setIsPortalAccessRequested] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [portalError, setPortalError] = useState('');
  const [teamSession, setTeamSession] = useState<Session | null>(null);
  const [teamEmail, setTeamEmail] = useState('');
  const [teamPassword, setTeamPassword] = useState('');
  const [teamError, setTeamError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [dossier, setDossier] = useState<ResidenceOnboardingDossier>(DEFAULT_ONBOARDING_DOSSIER);
  const [updates, setUpdates] = useState<PortalDailyUpdate[]>([]);
  const [billing, setBilling] = useState<StayBillingLedger>({
    referenceCode: '',
    totalBookingQuotedZar: 0,
    initialDepositPaidZar: 0,
    remainingStayBalanceZar: 0,
    incidentals: [],
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialReferenceCode) setReferenceCode(initialReferenceCode);
    if (initialPortalToken) setPortalToken(initialPortalToken);
    if (initialReferenceCode && (initialPortalToken || teamSession)) {
      setIsPortalAccessRequested(true);
    }
  }, [initialReferenceCode, initialPortalToken, teamSession]);

  useEffect(() => {
    let active = true;
    void getTeamAdminSession()
      .then((session) => {
        if (active) setTeamSession(session);
      })
      .catch((error: unknown) => {
        if (active) {
          setTeamError(
            error instanceof Error ? error.message : 'Team authentication could not be checked.'
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isPortalAccessRequested || !referenceCode.trim() || (!portalToken && !teamSession)) {
      setPortalData(null);
      return;
    }
    let active = true;
    setIsLoadingPortal(true);
    setPortalError('');
    void fetchClientPortalSession(
      referenceCode,
      portalToken || undefined,
      teamSession?.access_token
    )
      .then((data) => {
        if (!active) return;
        setPortalData(data);
        setDossier(data.dossier);
        setUpdates(data.session.updates);
        setBilling(data.session.billing);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPortalData(null);
        setPortalError(
          error instanceof Error ? error.message : 'The client portal could not be loaded.'
        );
      })
      .finally(() => {
        if (active) setIsLoadingPortal(false);
      });
    return () => {
      active = false;
    };
  }, [isPortalAccessRequested, portalToken, referenceCode, teamSession?.access_token]);

  const handlePortalAccessSubmit = (event: FormEvent) => {
    event.preventDefault();
    const normalizedReference = referenceCode.trim().toUpperCase();
    if (portalToken) {
      window.sessionStorage.setItem(
        `manor-guardians:portal-token:${normalizedReference}`,
        portalToken
      );
    }
    window.history.replaceState(
      null,
      '',
      `/portal?ref=${encodeURIComponent(normalizedReference)}`
    );
    setPortalData(null);
    setReferenceCode(normalizedReference);
    setIsPortalAccessRequested(true);
  };

  const handleTeamLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsSigningIn(true);
    setTeamError('');
    try {
      const session = await signInTeamAdmin(teamEmail.trim(), teamPassword);
      setTeamSession(session);
      setTeamPassword('');
      setIsPortalAccessRequested(Boolean(referenceCode.trim()));
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : 'Team sign-in failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleTeamLogout = async () => {
    setTeamError('');
    try {
      await signOutTeamAdmin();
      setTeamSession(null);
      if (!portalToken) {
        setPortalData(null);
        setIsPortalAccessRequested(false);
      }
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : 'Team sign-out failed.');
    }
  };

  const handleAddUpdate = (newUpdate: PortalDailyUpdate) => {
    setUpdates((prev) => [newUpdate, ...prev]);
  };

  const handleAddIncidental = (expense: IncidentalExpenseItem) => {
    setBilling((prev) => ({
      ...prev,
      incidentals: [...prev.incidentals, expense],
    }));
  };

  if (!portalData) {
    return (
      <section
        id="portal"
        className="no-print bg-[#121212] text-[#FAF9F6] py-12 sm:py-16 min-h-[75vh] border-b border-white/10"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBackToOverview}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#C5A059] hover:text-[#D4B26E] cursor-pointer py-1.5 mb-8"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Pretoria East Overview</span>
          </button>

          <div className="bg-[#1A1A1A] border border-white/10 rounded-sm p-6 sm:p-8 space-y-8">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#C5A059] mb-2">
                Secure Client Portal
              </p>
              <h1 className="font-display text-3xl font-medium">Open your residence file</h1>
              <p className="text-sm text-[#FAF9F6]/65 mt-2">
                Use the private link from your consultation confirmation, or enter your booking
                reference and access token.
              </p>
            </div>

            <form onSubmit={handlePortalAccessSubmit} className="space-y-4">
              <div>
                <label htmlFor="portal-reference" className="block text-xs font-semibold mb-1.5">
                  Booking Reference
                </label>
                <input
                  id="portal-reference"
                  required
                  value={referenceCode}
                  onChange={(event) => setReferenceCode(event.target.value)}
                  placeholder="PE-2026-4821"
                  autoComplete="off"
                  className="w-full min-h-[44px] px-3 py-2 bg-[#121212] border border-white/20 rounded-sm text-sm focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              {!teamSession && (
                <div>
                  <label htmlFor="portal-token" className="block text-xs font-semibold mb-1.5">
                    Private Access Token
                  </label>
                  <input
                    id="portal-token"
                    required={!teamSession}
                    type="password"
                    value={portalToken}
                    onChange={(event) => setPortalToken(event.target.value)}
                    placeholder="From your private portal link"
                    autoComplete="current-password"
                    className="w-full min-h-[44px] px-3 py-2 bg-[#121212] border border-white/20 rounded-sm text-sm focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              )}
              {portalError && (
                <p role="alert" className="text-sm text-red-300">{portalError}</p>
              )}
              <button
                type="submit"
                disabled={isLoadingPortal}
                className="w-full min-h-[46px] bg-[#C5A059] hover:bg-[#D4B26E] disabled:opacity-60 text-[#121212] font-semibold text-sm rounded-sm"
              >
                {isLoadingPortal ? 'Loading Secure File…' : 'Open Client Portal'}
              </button>
            </form>

            <div className="border-t border-white/10 pt-6">
              {teamSession ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-2 text-sm text-[#FAF9F6]/80">
                    <UserCheck className="w-4 h-4 text-[#C5A059]" aria-hidden="true" />
                    Team administrator signed in
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleTeamLogout()}
                    className="inline-flex items-center gap-2 text-xs text-[#FAF9F6]/65 hover:text-white"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              ) : (
                <form onSubmit={handleTeamLogin} className="space-y-3">
                  <p className="text-sm font-semibold">Team administrator sign-in</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      type="email"
                      required
                      value={teamEmail}
                      onChange={(event) => setTeamEmail(event.target.value)}
                      placeholder="Team email"
                      autoComplete="username"
                      className="min-h-[42px] px-3 py-2 bg-[#121212] border border-white/20 rounded-sm text-sm focus:outline-none focus:border-[#C5A059]"
                    />
                    <input
                      type="password"
                      required
                      value={teamPassword}
                      onChange={(event) => setTeamPassword(event.target.value)}
                      placeholder="Password"
                      autoComplete="current-password"
                      className="min-h-[42px] px-3 py-2 bg-[#121212] border border-white/20 rounded-sm text-sm focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  {teamError && <p role="alert" className="text-sm text-red-300">{teamError}</p>}
                  <button
                    type="submit"
                    disabled={isSigningIn}
                    className="min-h-[42px] px-4 py-2 border border-[#C5A059]/60 text-[#C5A059] text-sm font-semibold rounded-sm disabled:opacity-60"
                  >
                    {isSigningIn ? 'Signing in…' : 'Sign in as Team Admin'}
                  </button>
                </form>
              )}
              {!teamSession && teamError && (
                <p role="alert" className="text-sm text-red-300 mt-3">{teamError}</p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="portal"
      className="no-print bg-[#121212] text-[#FAF9F6] py-12 sm:py-16 min-h-[75vh] border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Overview Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToOverview}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#C5A059] hover:text-[#D4B26E] transition-colors cursor-pointer py-1.5"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Pretoria East Overview</span>
          </button>
          {teamSession && (
            <div className="inline-flex items-center gap-3">
              <span className="text-xs text-[#FAF9F6]/60">Team administrator signed in</span>
              <button
                type="button"
                onClick={() => void handleTeamLogout()}
                className="inline-flex items-center gap-1.5 text-xs text-[#FAF9F6]/70 hover:text-white"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Header + Two Primary Portal Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-white/10">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-medium tracking-[0.14em] uppercase text-[#C5A059] mb-3">
              Client Portal Workspace
            </p>
            <h1
              className="font-display font-medium text-[#FAF9F6] leading-[1.12] tracking-tight"
              style={{
                fontSize: 'clamp(1.85rem, 3.2vw, 2.85rem)',
                textWrap: 'balance',
              }}
            >
              Digital Residence Onboarding &amp; Live Stay Concierge Feed
            </h1>
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
            referenceCode={portalData.session.referenceCode}
            portalToken={portalToken || undefined}
            teamAccessToken={teamSession?.access_token}
            onSaveDossier={setDossier}
            onSwitchToLiveStay={() => setActiveTab('live-stay')}
          />
        ) : (
          <LiveStayUpdatesTab
            referenceCode={portalData.session.referenceCode}
            datesLabel={portalData.session.datesLabel}
            stayStatus={portalData.session.status}
            dossier={dossier}
            updates={updates}
            billing={billing}
            teamAccessToken={teamSession?.access_token}
            onAddUpdate={handleAddUpdate}
            onAddIncidental={handleAddIncidental}
          />
        )}
      </div>
    </section>
  );
}
