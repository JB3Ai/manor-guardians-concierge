import { ChangeEvent, FormEvent, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  CreditCard,
  Droplets,
  ExternalLink,
  PawPrint,
  Plus,
  ShieldCheck,
  UserCheck,
  Zap,
} from 'lucide-react';
import { CARE_TEAM_MEMBERS } from '../../data/services';
import {
  createPaystackFinalInvoiceLink,
  logStayIncidentalExpense,
  PaystackDepositLinkResponse,
  publishStayDailyUpdate,
} from '../../services/apiPlaceholders';
import { formatZar } from '../../services/conciergeApi';
import {
  IncidentalExpenseItem,
  PortalDailyUpdate,
  ResidenceOnboardingDossier,
  StayBillingLedger,
} from '../../types/concierge';
import { ResilientImage } from '../ResilientImage';

interface LiveStayUpdatesTabProps {
  referenceCode: string;
  datesLabel: string;
  dossier: ResidenceOnboardingDossier;
  updates: PortalDailyUpdate[];
  billing: StayBillingLedger;
  onAddUpdate: (update: PortalDailyUpdate) => void;
  onAddIncidental: (expense: IncidentalExpenseItem) => void;
}

type PortalRoleMode = 'client' | 'team';

const UPDATE_SLOT_PRESETS = [
  '08:00 AM Morning Check-In',
  '12:30 PM Midday Residence Sweep',
  '05:30 PM Evening Update',
];

const SAMPLE_PHOTO_OPTIONS = [
  { label: 'No photo attached', url: '' },
  {
    label: 'Veranda & Pool Pet Check Photo',
    url: '/images/portal_daily_update_pet_1794747603008.jpg',
  },
  {
    label: 'Terrace Golden Hour Check Photo',
    url: '/images/service_estate_pet_care_1794747601774.jpg',
  },
  {
    label: 'Kitchen & Welcome Refresh Photo',
    url: '/images/service_welcome_reset_1794747602927.jpg',
  },
];

export function LiveStayUpdatesTab({
  referenceCode,
  datesLabel,
  dossier,
  updates,
  billing,
  onAddUpdate,
  onAddIncidental,
}: LiveStayUpdatesTabProps) {
  const [roleMode, setRoleMode] = useState<PortalRoleMode>('client');

  const [slotTitle, setSlotTitle] = useState(UPDATE_SLOT_PRESETS[0]);
  const [guardianName, setGuardianName] = useState(CARE_TEAM_MEMBERS[0]);
  const [dogsFedWalked, setDogsFedWalked] = useState(true);
  const [poolAndGarden, setPoolAndGarden] = useState(true);
  const [securityAndPowerOn, setSecurityAndPowerOn] = useState(true);
  const [caretakerNotes, setCaretakerNotes] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(SAMPLE_PHOTO_OPTIONS[1].url);
  const [isPublishingUpdate, setIsPublishingUpdate] = useState(false);

  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [isLoggingExpense, setIsLoggingExpense] = useState(false);

  const [isSettlingInvoice, setIsSettlingInvoice] = useState(false);
  const [finalSettlement, setFinalSettlement] = useState<PaystackDepositLinkResponse | null>(
    null
  );

  const incidentalsTotalZar = billing.incidentals.reduce(
    (sum, item) => sum + item.amountZar,
    0
  );
  const finalInvoiceDueZar = billing.remainingStayBalanceZar + incidentalsTotalZar;

  const handleLocalPhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setSelectedPhotoUrl(objectUrl);
  };

  const handlePostUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!caretakerNotes.trim()) return;

    setIsPublishingUpdate(true);
    try {
      const now = new Date();
      const newUpdate: PortalDailyUpdate = {
        id: `upd-${Date.now()}`,
        slotTitle,
        dateLabel: now.toLocaleDateString('en-ZA', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        timestampSast: `${now.toLocaleTimeString('en-ZA', {
          hour: '2-digit',
          minute: '2-digit',
        })} SAST`,
        guardianName,
        statuses: {
          dogsFedWalked,
          poolAndGarden,
          securityAndPowerOn,
        },
        caretakerNotes: caretakerNotes.trim(),
        photoUrl: selectedPhotoUrl || undefined,
        photoAlt: `${slotTitle} update posted by ${guardianName}`,
      };

      await publishStayDailyUpdate(newUpdate);
      onAddUpdate(newUpdate);
      setCaretakerNotes('');
    } finally {
      setIsPublishingUpdate(false);
    }
  };

  const handleLogExpense = async (e: FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(expenseAmount);
    if (!expenseDesc.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) return;

    setIsLoggingExpense(true);
    try {
      const item: IncidentalExpenseItem = {
        id: `inc-${Date.now()}`,
        dateLabel: new Date().toLocaleDateString('en-ZA', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        description: expenseDesc.trim(),
        loggedBy: guardianName.split(' (')[0],
        amountZar: numericAmount,
      };
      await logStayIncidentalExpense(item);
      onAddIncidental(item);
      setExpenseDesc('');
      setExpenseAmount('');
      setFinalSettlement(null);
    } finally {
      setIsLoggingExpense(false);
    }
  };

  const handleSettleFinalInvoice = async () => {
    setIsSettlingInvoice(true);
    try {
      const response = await createPaystackFinalInvoiceLink(
        referenceCode,
        finalInvoiceDueZar
      );
      setFinalSettlement(response);
    } finally {
      setIsSettlingInvoice(false);
    }
  };

  const petSummaryText =
    dossier.pets.map((p) => `${p.name || 'Pet'} (${p.breed || 'Companion'})`).join(' · ') ||
    'Registered Household Pets';

  return (
    <div className="mt-8 space-y-8">
      {/* Top Bar: Active Residence Banner + Client / Team Admin Toggle */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-sm p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#C5A059]">
            <span className="font-mono">{referenceCode}</span>
            <span aria-hidden="true">·</span>
            <span>{datesLabel}</span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl font-medium text-[#FAF9F6]">
            {dossier.residenceNameAndAddress}
          </h3>
          <p className="text-xs sm:text-sm text-[#FAF9F6]/70">{petSummaryText}</p>
        </div>

        <div
          role="group"
          aria-label="Portal perspective switch"
          className="inline-flex items-center gap-1 p-1 bg-[#121212] border border-white/15 rounded-sm self-start lg:self-center"
        >
          <button
            type="button"
            onClick={() => setRoleMode('client')}
            className={`px-4 py-2 min-h-[40px] text-xs sm:text-sm font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              roleMode === 'client'
                ? 'bg-[#FAF9F6] text-[#121212] font-semibold'
                : 'text-[#FAF9F6]/75 hover:text-[#FAF9F6]'
            }`}
          >
            Client View
          </button>
          <button
            type="button"
            onClick={() => setRoleMode('team')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-xs sm:text-sm font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              roleMode === 'team'
                ? 'bg-[#C5A059] text-[#121212] font-semibold'
                : 'text-[#FAF9F6]/75 hover:text-[#FAF9F6]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Team Admin View</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {roleMode === 'team' && (
            <form
              onSubmit={handlePostUpdate}
              className="bg-[#1A1A1A] border border-[#C5A059]/45 rounded-sm p-6 space-y-5"
            >
              <div className="pb-3 border-b border-white/10">
                <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#C5A059]">
                  Team Dispatch Composer
                </p>
                <h4 className="font-display text-2xl font-medium text-[#FAF9F6]">
                  Post New Daily Timed Update
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="team-slot"
                    className="block text-xs font-semibold text-[#FAF9F6]/80 mb-1.5"
                  >
                    Dispatch Window
                  </label>
                  <select
                    id="team-slot"
                    value={slotTitle}
                    onChange={(e) => setSlotTitle(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                  >
                    {UPDATE_SLOT_PRESETS.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="team-guardian"
                    className="block text-xs font-semibold text-[#FAF9F6]/80 mb-1.5"
                  >
                    Posting Team Member
                  </label>
                  <select
                    id="team-guardian"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                  >
                    {CARE_TEAM_MEMBERS.map((member) => (
                      <option key={member} value={member}>
                        {member}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#FAF9F6]/80 mb-2">
                  Verified Home Checks
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className="flex items-center gap-2.5 p-3 bg-[#121212] border border-white/15 rounded-sm text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dogsFedWalked}
                      onChange={(e) => setDogsFedWalked(e.target.checked)}
                      className="w-4 h-4 accent-[#C5A059]"
                    />
                    <span>Dogs Fed / Walked</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-3 bg-[#121212] border border-white/15 rounded-sm text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={poolAndGarden}
                      onChange={(e) => setPoolAndGarden(e.target.checked)}
                      className="w-4 h-4 accent-[#C5A059]"
                    />
                    <span>Pool &amp; Garden</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-3 bg-[#121212] border border-white/15 rounded-sm text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securityAndPowerOn}
                      onChange={(e) => setSecurityAndPowerOn(e.target.checked)}
                      className="w-4 h-4 accent-[#C5A059]"
                    />
                    <span>Security &amp; Power On</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="team-photo-preset"
                    className="block text-xs font-semibold text-[#FAF9F6]/80 mb-1.5"
                  >
                    Photo Attachment Preset
                  </label>
                  <select
                    id="team-photo-preset"
                    value={
                      SAMPLE_PHOTO_OPTIONS.some((o) => o.url === selectedPhotoUrl)
                        ? selectedPhotoUrl
                        : ''
                    }
                    onChange={(e) => setSelectedPhotoUrl(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                  >
                    {SAMPLE_PHOTO_OPTIONS.map((opt) => (
                      <option key={opt.label} value={opt.url}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="team-photo-upload"
                    className="block text-xs font-semibold text-[#FAF9F6]/80 mb-1.5"
                  >
                    Or Attach Device Photo
                  </label>
                  <label
                    htmlFor="team-photo-upload"
                    className="flex items-center justify-center gap-2 w-full min-h-[44px] px-3 py-2 text-xs font-medium bg-[#121212] border border-white/20 hover:border-[#C5A059] rounded-sm text-[#FAF9F6]/85 cursor-pointer transition-colors"
                  >
                    <Camera className="w-4 h-4 text-[#C5A059]" aria-hidden="true" />
                    <span>Upload Photo Preview</span>
                  </label>
                  <input
                    id="team-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLocalPhotoSelect}
                    className="sr-only"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="team-notes"
                  className="block text-xs font-semibold text-[#FAF9F6]/80 mb-1.5"
                >
                  Caretaker Notes *
                </label>
                <textarea
                  id="team-notes"
                  rows={3}
                  required
                  value={caretakerNotes}
                  onChange={(e) => setCaretakerNotes(e.target.value)}
                  placeholder="Log dog appetite, playtime, municipal bins, pool clarity, or solar inverter charge…"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <button
                type="submit"
                disabled={isPublishingUpdate || !caretakerNotes.trim()}
                className="w-full min-h-[46px] bg-[#C5A059] hover:bg-[#D4B26E] disabled:opacity-50 text-[#121212] font-semibold text-sm px-5 py-2.5 rounded-sm transition-colors cursor-pointer"
              >
                {isPublishingUpdate ? 'Publishing Dispatch…' : 'Publish Update to Client Feed'}
              </button>
            </form>
          )}

          {/* Daily Timed Updates Feed */}
          <div className="space-y-5">
            {updates.map((entry) => (
              <article
                key={entry.id}
                className="bg-[#1A1A1A] border border-white/10 rounded-sm overflow-hidden"
              >
                {entry.photoUrl && (
                  <div className="aspect-[16/9] w-full bg-[#121212]">
                    <ResilientImage
                      src={entry.photoUrl}
                      alt={entry.photoAlt || entry.slotTitle}
                      fallbackTitle={entry.slotTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#FAF9F6]/65">
                    <span className="text-[#C5A059] font-semibold">{entry.slotTitle}</span>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span>{entry.dateLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.timestampSast}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-3 border-y border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                      <PawPrint
                        className={`w-3.5 h-3.5 shrink-0 ${
                          entry.statuses.dogsFedWalked
                            ? 'text-[#C5A059]'
                            : 'text-[#FAF9F6]/40'
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={
                          entry.statuses.dogsFedWalked
                            ? 'text-[#FAF9F6] font-medium'
                            : 'text-[#FAF9F6]/50'
                        }
                      >
                        Dogs Fed / Walked:{' '}
                        {entry.statuses.dogsFedWalked ? 'Verified' : 'Pending'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Droplets
                        className={`w-3.5 h-3.5 shrink-0 ${
                          entry.statuses.poolAndGarden
                            ? 'text-[#C5A059]'
                            : 'text-[#FAF9F6]/40'
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={
                          entry.statuses.poolAndGarden
                            ? 'text-[#FAF9F6] font-medium'
                            : 'text-[#FAF9F6]/50'
                        }
                      >
                        Pool &amp; Garden:{' '}
                        {entry.statuses.poolAndGarden ? 'Checked' : 'Pending'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Zap
                        className={`w-3.5 h-3.5 shrink-0 ${
                          entry.statuses.securityAndPowerOn
                            ? 'text-[#C5A059]'
                            : 'text-[#FAF9F6]/40'
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={
                          entry.statuses.securityAndPowerOn
                            ? 'text-[#FAF9F6] font-medium'
                            : 'text-[#FAF9F6]/50'
                        }
                      >
                        Security &amp; Power:{' '}
                        {entry.statuses.securityAndPowerOn ? 'Online' : 'Alert'}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-[#FAF9F6]/85 leading-relaxed">
                    {entry.caretakerNotes}
                  </p>

                  <p className="text-xs text-[#FAF9F6]/55">
                    Logged by <span className="text-[#FAF9F6]/80">{entry.guardianName}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Right Column: Live "Incidentals & Final Bill" Ledger */}
        <aside className="lg:col-span-5 bg-[#1A1A1A] border border-white/10 rounded-sm p-6 space-y-6 lg:sticky lg:top-24">
          <div className="pb-4 border-b border-white/10">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#C5A059] mb-1">
              Stay Accounting
            </p>
            <h4 className="font-display text-2xl sm:text-3xl font-medium text-[#FAF9F6]">
              Incidentals &amp; Final Bill
            </h4>
            <p className="text-xs text-[#FAF9F6]/65 mt-1">
              Transparent ZAR ledger combining your remaining 50% balance and verified
              out-of-pocket concierge receipts.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm tabular-nums">
              <thead>
                <tr className="border-b border-white/15 text-[#FAF9F6]/60 text-xs">
                  <th className="py-2.5 pr-3 font-medium">Ledger Item</th>
                  <th className="py-2.5 text-right font-medium">ZAR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr>
                  <td className="py-3 pr-3">
                    <div className="text-[#FAF9F6]">Total Confirmed Care Tariff</div>
                    <div className="text-[11px] text-[#FAF9F6]/55">
                      Ref {billing.referenceCode}
                    </div>
                  </td>
                  <td className="py-3 text-right text-[#FAF9F6]">
                    {formatZar(billing.totalBookingQuotedZar)}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 pr-3">
                    <div className="text-[#C5A059]">Initial 50% Deposit Paid</div>
                    <div className="text-[11px] text-[#FAF9F6]/55">Settled after vetting</div>
                  </td>
                  <td className="py-3 text-right text-[#C5A059]">
                    − {formatZar(billing.initialDepositPaidZar)}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 pr-3">
                    <div className="text-[#FAF9F6]">Remaining 50% Stay Balance</div>
                    <div className="text-[11px] text-[#FAF9F6]/55">Due on stay completion</div>
                  </td>
                  <td className="py-3 text-right font-medium text-[#FAF9F6]">
                    {formatZar(billing.remainingStayBalanceZar)}
                  </td>
                </tr>

                {billing.incidentals.map((exp) => (
                  <tr key={exp.id}>
                    <td className="py-3 pr-3">
                      <div className="text-[#FAF9F6]/90">{exp.description}</div>
                      <div className="text-[11px] text-[#FAF9F6]/55">
                        {exp.dateLabel} · Logged by {exp.loggedBy}
                      </div>
                    </td>
                    <td className="py-3 text-right text-[#FAF9F6]">
                      +{formatZar(exp.amountZar)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="border-t border-white/25">
                  <td className="pt-4 pr-3">
                    <span className="font-semibold text-[#FAF9F6]">
                      Total Final Invoice Due
                    </span>
                    <span className="block text-[11px] text-[#FAF9F6]/55">
                      50% Balance + {formatZar(incidentalsTotalZar)} Incidentals
                    </span>
                  </td>
                  <td className="pt-4 text-right font-display text-2xl sm:text-3xl font-semibold text-[#C5A059]">
                    {formatZar(finalInvoiceDueZar)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {roleMode === 'team' && (
            <form
              onSubmit={handleLogExpense}
              className="p-4 bg-[#121212] border border-white/15 rounded-sm space-y-3"
            >
              <p className="text-xs font-semibold text-[#C5A059]">
                Log Out-of-Pocket Expense (Team Admin)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="e.g. Woolworths Milk & Flowers"
                  className="sm:col-span-2 min-h-[40px] px-3 py-2 text-xs bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                />
                <input
                  type="number"
                  min={1}
                  step="1"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="ZAR (e.g. 245)"
                  className="min-h-[40px] px-3 py-2 text-xs bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] tabular-nums focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <button
                type="submit"
                disabled={isLoggingExpense || !expenseDesc.trim() || !expenseAmount}
                className="inline-flex items-center justify-center gap-1.5 w-full min-h-[40px] border border-[#C5A059]/60 hover:border-[#C5A059] disabled:opacity-45 text-[#C5A059] text-xs font-semibold px-3 py-2 rounded-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isLoggingExpense ? 'Logging Expense…' : 'Add Expense to Ledger'}</span>
              </button>
            </form>
          )}

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={handleSettleFinalInvoice}
              disabled={isSettlingInvoice}
              className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-[#C5A059] hover:bg-[#D4B26E] disabled:opacity-60 text-[#121212] font-semibold text-sm px-5 py-3 rounded-sm transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4 stroke-[2]" aria-hidden="true" />
              <span>
                {isSettlingInvoice
                  ? 'Preparing Paystack Settlement…'
                  : `Settle Final Invoice (${formatZar(finalInvoiceDueZar)})`}
              </span>
            </button>

            {finalSettlement && (
              <div className="p-4 bg-[#121212] border border-[#C5A059]/50 rounded-sm space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#FAF9F6]">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A059]" aria-hidden="true" />
                  <span>Paystack Settlement Link Ready</span>
                </div>
                <p className="font-mono text-[11px] text-[#FAF9F6]/65">
                  Ref: {finalSettlement.reference} · {formatZar(finalSettlement.amountZar)} ZAR
                </p>
                <a
                  href={finalSettlement.authorizationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#C5A059] hover:text-[#D4B26E] font-semibold pt-1"
                >
                  <span>Proceed to Paystack Checkout</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] text-[#FAF9F6]/55 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059] shrink-0" aria-hidden="true" />
              <span>All out-of-pocket receipts are photographed and archived on request.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
