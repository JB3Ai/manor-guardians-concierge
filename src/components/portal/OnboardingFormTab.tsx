import { FormEvent, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BellRing,
  CheckCircle2,
  ExternalLink,
  PawPrint,
  Plus,
  Shield,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  saveResidenceOnboardingDossier,
  triggerUrgentAssistanceAlert,
  UrgentAssistanceResponse,
} from '../../services/apiPlaceholders';
import {
  EmergencyContactPerson,
  PetOnboardingProfile,
  ResidenceOnboardingDossier,
} from '../../types/concierge';

interface OnboardingFormTabProps {
  dossier: ResidenceOnboardingDossier;
  onSaveDossier: (saved: ResidenceOnboardingDossier) => void;
  onSwitchToLiveStay: () => void;
}

type OnboardingStep = 1 | 2 | 3;

const STEP_META = [
  { step: 1 as const, label: '01. Property & Security', icon: Shield },
  { step: 2 as const, label: '02. Pet Profiles', icon: PawPrint },
  { step: 3 as const, label: '03. “Welcome Home” Refresh', icon: Sparkles },
];

export function OnboardingFormTab({
  dossier,
  onSaveDossier,
  onSwitchToLiveStay,
}: OnboardingFormTabProps) {
  const [draft, setDraft] = useState<ResidenceOnboardingDossier>(dossier);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<{
    dossierId: string;
    savedAtLabel: string;
  } | null>(null);

  // Emergency Protocol Notification State
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  const [isNotifying, setIsNotifying] = useState(false);
  const [urgentAlertResult, setUrgentAlertResult] =
    useState<UrgentAssistanceResponse | null>(null);

  const updateField = <K extends keyof ResidenceOnboardingDossier>(
    key: K,
    value: ResidenceOnboardingDossier[K]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateEmergencyContact = (
    role: 'primaryContact' | 'secondaryContact',
    field: keyof EmergencyContactPerson,
    value: string
  ) => {
    setDraft((prev) => ({
      ...prev,
      emergencyProtocol: {
        ...prev.emergencyProtocol,
        [role]: {
          ...prev.emergencyProtocol[role],
          [field]: value,
        },
      },
    }));
  };

  const handleUpdatePet = (
    petId: string,
    field: keyof PetOnboardingProfile,
    value: string
  ) => {
    setDraft((prev) => ({
      ...prev,
      pets: prev.pets.map((p) => (p.id === petId ? { ...p, [field]: value } : p)),
    }));
  };

  const handleAddPet = () => {
    const newPet: PetOnboardingProfile = {
      id: `pet-${Date.now()}`,
      name: '',
      breed: '',
      feedingScheduleAndPortions: '',
      medicationsOrAllergies: 'None',
      behavioralNotes: '',
      primaryVetContact: draft.pets[0]?.primaryVetContact || '',
    };
    setDraft((prev) => ({ ...prev, pets: [...prev.pets, newPet] }));
  };

  const handleRemovePet = (petId: string) => {
    if (draft.pets.length <= 1) return;
    setDraft((prev) => ({
      ...prev,
      pets: prev.pets.filter((p) => p.id !== petId),
    }));
  };

  const validateStep = (step: OnboardingStep): string[] => {
    const stepErrors: string[] = [];
    if (step === 1) {
      if (draft.residenceNameAndAddress.trim().length < 4) {
        stepErrors.push('Please enter your Residence Name & Street Address.');
      }
      if (draft.gateAccessProcedure.trim().length < 4) {
        stepErrors.push('Please specify your gate access / intercom procedure.');
      }
      if (draft.armedResponseCompanyAndPassword.trim().length < 3) {
        stepErrors.push('Please include your armed response company & password.');
      }
    }
    if (step === 2) {
      draft.pets.forEach((pet, idx) => {
        if (!pet.name.trim()) {
          stepErrors.push(`Please enter a name for Pet #${idx + 1}.`);
        }
        if (!pet.feedingScheduleAndPortions.trim()) {
          stepErrors.push(
            `Please specify feeding schedule & portions for ${pet.name || `Pet #${idx + 1}`}.`
          );
        }
      });
    }
    if (step === 3) {
      if (!draft.expectedReturnDateTime) {
        stepErrors.push('Please set your expected return date & time.');
      }
    }
    return stepErrors;
  };

  const handleNextStep = () => {
    const stepErrors = validateStep(currentStep);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors([]);
    setCurrentStep((prev) => (prev < 3 ? ((prev + 1) as OnboardingStep) : prev));
  };

  const handleSubmitDossier = async (e: FormEvent) => {
    e.preventDefault();
    const allErrors = [...validateStep(1), ...validateStep(2), ...validateStep(3)];
    if (allErrors.length > 0) {
      setErrors(allErrors);
      return;
    }

    setErrors([]);
    setIsSaving(true);
    try {
      const response = await saveResidenceOnboardingDossier(draft);
      const savedRecord: ResidenceOnboardingDossier = {
        ...draft,
        dossierId: response.dossierId,
        savedAtIso: response.savedAtIso,
      };
      setDraft(savedRecord);
      onSaveDossier(savedRecord);
      setSavedNotice({
        dossierId: response.dossierId,
        savedAtLabel: new Date(response.savedAtIso).toLocaleTimeString('en-ZA', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerUrgentNotify = async () => {
    const { primaryContact, secondaryContact, urgentNote } = draft.emergencyProtocol;

    if (!primaryContact.fullName.trim() || !primaryContact.phone.trim()) {
      setEmergencyError(
        'Please complete the Primary Emergency Contact Name and Phone before dispatching an urgent notification.'
      );
      return;
    }

    setEmergencyError(null);
    setIsNotifying(true);
    try {
      const res = await triggerUrgentAssistanceAlert({
        residenceAddress: draft.residenceNameAndAddress,
        primaryContactName: primaryContact.fullName,
        primaryContactPhone: primaryContact.phone,
        secondaryContactName: secondaryContact.fullName,
        secondaryContactPhone: secondaryContact.phone,
        urgentReason: urgentNote,
      });
      setUrgentAlertResult(res);
      onSaveDossier(draft);
    } finally {
      setIsNotifying(false);
    }
  };

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Rail */}
      <aside className="lg:col-span-4 bg-[#1A1A1A] border border-white/10 rounded-sm p-6 space-y-6">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#C5A059] mb-1">
            Vetted Client Intake
          </p>
          <h3 className="font-display text-2xl font-medium text-[#FAF9F6]">
            Digital Residence Dossier
          </h3>
          <p className="text-xs sm:text-sm text-[#FAF9F6]/65 mt-2 leading-relaxed">
            Once we have completed your free meet-and-greet and pet introduction, complete these
            three sections and verify your emergency contacts below.
          </p>
        </div>

        <nav aria-label="Onboarding steps" className="space-y-2">
          {STEP_META.map((item) => {
            const Icon = item.icon;
            const isActive = currentStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  setErrors([]);
                  setCurrentStep(item.step);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 min-h-[46px] rounded-sm border text-left text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#121212] border-[#C5A059] text-[#FAF9F6] font-semibold'
                    : 'bg-[#151515] border-white/10 text-[#FAF9F6]/70 hover:border-white/25 hover:text-[#FAF9F6]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#C5A059]' : 'text-[#FAF9F6]/50'
                  }`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {savedNotice && (
          <div className="p-4 bg-[#121212] border border-[#C5A059]/50 rounded-sm space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                className="w-4 h-4 text-[#C5A059] mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-semibold text-[#FAF9F6]">
                  Dossier Saved ({savedNotice.dossierId})
                </p>
                <p className="text-[11px] text-[#FAF9F6]/65 mt-0.5">
                  Synced at {savedNotice.savedAtLabel} SAST · Ready for handover
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onSwitchToLiveStay}
              className="w-full min-h-[40px] bg-[#C5A059] hover:bg-[#D4B26E] text-[#121212] text-xs font-semibold px-3 py-2 rounded-sm transition-colors cursor-pointer"
            >
              Open Live Stay &amp; Daily Updates
            </button>
          </div>
        )}
      </aside>

      {/* Right Column: Multi-Step Form + Emergency Protocol Card */}
      <div className="lg:col-span-8 space-y-8">
        <form
          onSubmit={handleSubmitDossier}
          noValidate
          className="bg-[#1A1A1A] border border-white/10 rounded-sm p-6 sm:p-8 space-y-6"
        >
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="pb-4 border-b border-white/10">
                <h4 className="font-display text-2xl font-medium text-[#FAF9F6]">
                  01. Residence &amp; Security Protocols
                </h4>
                <p className="text-xs sm:text-sm text-[#FAF9F6]/65 mt-1">
                  Home access, armed response credentials, utility shut-offs, and bin collection
                  days.
                </p>
              </div>

              <div>
                <label
                  htmlFor="onb-address"
                  className="block text-xs font-semibold tracking-wide text-[#FAF9F6]/85 mb-1.5"
                >
                  Residence Name &amp; Street Address *
                </label>
                <input
                  id="onb-address"
                  type="text"
                  value={draft.residenceNameAndAddress}
                  onChange={(e) => updateField('residenceNameAndAddress', e.target.value)}
                  placeholder="e.g. 18 Rigel Avenue North, Waterkloof, Pretoria East"
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label
                  htmlFor="onb-gate"
                  className="block text-xs font-semibold tracking-wide text-[#FAF9F6]/85 mb-1.5"
                >
                  Gate Access &amp; Boom Procedure *
                </label>
                <textarea
                  id="onb-gate"
                  rows={2}
                  value={draft.gateAccessProcedure}
                  onChange={(e) => updateField('gateAccessProcedure', e.target.value)}
                  placeholder="Intercom code, visitor PIN, boom guard clearance instructions"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label
                  htmlFor="onb-armed"
                  className="block text-xs font-semibold tracking-wide text-[#FAF9F6]/85 mb-1.5"
                >
                  Armed Response Company &amp; Security Password *
                </label>
                <input
                  id="onb-armed"
                  type="text"
                  value={draft.armedResponseCompanyAndPassword}
                  onChange={(e) =>
                    updateField('armedResponseCompanyAndPassword', e.target.value)
                  }
                  placeholder="e.g. Brinant Security · Verbal Password"
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label
                  htmlFor="onb-utilities"
                  className="block text-xs font-semibold tracking-wide text-[#FAF9F6]/85 mb-1.5"
                >
                  Main Water Shut-Off &amp; DB Board / Inverter Locations
                </label>
                <textarea
                  id="onb-utilities"
                  rows={2}
                  value={draft.waterShutoffAndDbLocations}
                  onChange={(e) => updateField('waterShutoffAndDbLocations', e.target.value)}
                  placeholder="Main water valve, DB board, and solar/generator changeover location"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label
                  htmlFor="onb-quirks"
                  className="block text-xs font-semibold tracking-wide text-[#FAF9F6]/85 mb-1.5"
                >
                  House Quirks (Pool Pump, Alarm Zones, Bin Collection Days)
                </label>
                <textarea
                  id="onb-quirks"
                  rows={2}
                  value={draft.houseQuirks}
                  onChange={(e) => updateField('houseQuirks', e.target.value)}
                  placeholder="Pool pump hours, bypassed garden beams, municipal bin day, plant watering notes"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-display text-2xl font-medium text-[#FAF9F6]">
                    02. Household Pet Profiles
                  </h4>
                  <p className="text-xs sm:text-sm text-[#FAF9F6]/65 mt-1">
                    Add an individual care profile for each dog or pet in your home.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPet}
                  className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 min-h-[42px] bg-[#121212] border border-[#C5A059]/60 hover:border-[#C5A059] text-[#C5A059] text-xs font-semibold rounded-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Add Another Dog / Pet</span>
                </button>
              </div>

              <div className="space-y-6">
                {draft.pets.map((pet, idx) => (
                  <div
                    key={pet.id}
                    className="p-5 bg-[#121212] border border-white/10 rounded-sm space-y-4"
                  >
                    <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
                      <span className="font-display text-xl text-[#C5A059]">
                        Pet Profile #{idx + 1}
                        {pet.name ? ` · ${pet.name}` : ''}
                      </span>
                      {draft.pets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePet(pet.id)}
                          className="inline-flex items-center gap-1.5 text-xs text-[#FAF9F6]/60 hover:text-[#F87171] transition-colors cursor-pointer py-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#FAF9F6]/80 mb-1">
                          Pet Name *
                        </label>
                        <input
                          type="text"
                          value={pet.name}
                          onChange={(e) => handleUpdatePet(pet.id, 'name', e.target.value)}
                          placeholder="e.g. Zuri"
                          className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#FAF9F6]/80 mb-1">
                          Breed &amp; Age
                        </label>
                        <input
                          type="text"
                          value={pet.breed}
                          onChange={(e) => handleUpdatePet(pet.id, 'breed', e.target.value)}
                          placeholder="e.g. Rhodesian Ridgeback (4 yrs)"
                          className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#FAF9F6]/80 mb-1">
                          Feeding Schedule &amp; Exact Portions *
                        </label>
                        <input
                          type="text"
                          value={pet.feedingScheduleAndPortions}
                          onChange={(e) =>
                            handleUpdatePet(
                              pet.id,
                              'feedingScheduleAndPortions',
                              e.target.value
                            )
                          }
                          placeholder="e.g. 07:00 & 17:30 — 320g Acana Adult + salmon oil"
                          className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#FAF9F6]/80 mb-1">
                          Medications &amp; Allergies
                        </label>
                        <input
                          type="text"
                          value={pet.medicationsOrAllergies}
                          onChange={(e) =>
                            handleUpdatePet(pet.id, 'medicationsOrAllergies', e.target.value)
                          }
                          placeholder="e.g. 1 × Mobiflex chew AM; no poultry"
                          className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#FAF9F6]/80 mb-1">
                          Primary Vet Contact
                        </label>
                        <input
                          type="text"
                          value={pet.primaryVetContact}
                          onChange={(e) =>
                            handleUpdatePet(pet.id, 'primaryVetContact', e.target.value)
                          }
                          placeholder="Clinic name & phone number"
                          className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#FAF9F6]/80 mb-1">
                          Behavioral Notes &amp; Playtime Preferences
                        </label>
                        <input
                          type="text"
                          value={pet.behavioralNotes}
                          onChange={(e) =>
                            handleUpdatePet(pet.id, 'behavioralNotes', e.target.value)
                          }
                          placeholder="Playtime games, leash preferences, sleeping quarters, storm calming"
                          className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="pb-4 border-b border-white/10">
                <h4 className="font-display text-2xl font-medium text-[#FAF9F6]">
                  03. “Welcome Home” Refresh Preferences
                </h4>
                <p className="text-xs sm:text-sm text-[#FAF9F6]/65 mt-1">
                  Specify your arrival timing, pantry essentials, fresh flower preferences, and
                  laundry instructions.
                </p>
              </div>

              <div>
                <label
                  htmlFor="onb-return-dt"
                  className="block text-xs font-semibold tracking-wide text-[#FAF9F6]/85 mb-1.5"
                >
                  Expected Return Date &amp; Time *
                </label>
                <input
                  id="onb-return-dt"
                  type="datetime-local"
                  value={draft.expectedReturnDateTime}
                  onChange={(e) => updateField('expectedReturnDateTime', e.target.value)}
                  className="w-full sm:max-w-xs min-h-[44px] px-3.5 py-2.5 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label
                  htmlFor="onb-groceries"
                  className="block text-xs font-semibold tracking-wide text-[#FAF9F6]/85 mb-1.5"
                >
                  Fresh Bread, Milk, Pantry Staples &amp; Flower Preferences
                </label>
                <textarea
                  id="onb-groceries"
                  rows={3}
                  value={draft.fridgeGroceryList}
                  onChange={(e) => updateField('fridgeGroceryList', e.target.value)}
                  placeholder="Milk type, fresh sourdough, coffee beans, butter, protea or seasonal flowers"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label
                  htmlFor="onb-laundry"
                  className="block text-xs font-semibold tracking-wide text-[#FAF9F6]/85 mb-1.5"
                >
                  Laundry, Linen &amp; Curtain / Climate Instructions
                </label>
                <textarea
                  id="onb-laundry"
                  rows={3}
                  value={draft.laundryAndCurtainInstructions}
                  onChange={(e) => updateField('laundryAndCurtainInstructions', e.target.value)}
                  placeholder="Bedroom linen turnover, curtain opening schedule, AC temperature prior to arrival"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div
              role="alert"
              className="p-4 bg-[#2A1515] border border-[#F87171]/40 rounded-sm text-xs sm:text-sm text-[#FECACA] space-y-1"
            >
              <div className="flex items-center gap-2 font-semibold text-[#F87171]">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Please review the onboarding details:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Step Navigation & Save Actions */}
          <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setErrors([]);
                  setCurrentStep((prev) => (prev - 1) as OnboardingStep);
                }}
                className="inline-flex items-center justify-center gap-2 min-h-[46px] px-4 py-2.5 border border-white/20 hover:border-[#C5A059] text-sm font-medium text-[#FAF9F6] rounded-sm transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Previous Step</span>
              </button>
            ) : (
              <span className="text-xs text-[#FAF9F6]/50">
                Step {currentStep} of 3 · Encrypted local &amp; Supabase-ready schema
              </span>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-2.5 bg-[#C5A059] hover:bg-[#D4B26E] text-[#121212] text-sm font-semibold rounded-sm transition-colors cursor-pointer"
              >
                <span>Continue to Step 0{currentStep + 1}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 bg-[#C5A059] hover:bg-[#D4B26E] disabled:opacity-60 text-[#121212] text-sm font-semibold rounded-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2]" aria-hidden="true" />
                <span>
                  {isSaving ? 'Saving Residence Dossier…' : 'Save Residence & Pet Onboarding'}
                </span>
              </button>
            )}
          </div>
        </form>

        {/* Dedicated Emergency Protocol Card */}
        <section
          aria-labelledby="emergency-protocol-heading"
          className="bg-[#1A1A1A] border border-[#C5A059]/45 rounded-sm p-6 sm:p-8 space-y-6"
        >
          <div className="pb-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-[#C5A059]" aria-hidden="true" />
                <span className="text-xs font-medium tracking-[0.14em] uppercase text-[#C5A059]">
                  Urgent Escalation &amp; Keyholder Registry
                </span>
              </div>
              <h4
                id="emergency-protocol-heading"
                className="font-display text-2xl sm:text-3xl font-medium text-[#FAF9F6]"
              >
                Emergency Protocol
              </h4>
            </div>
            <span className="text-xs text-[#FAF9F6]/60">
              Primary &amp; Secondary Homeowner Contacts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Emergency Contact */}
            <div className="p-5 bg-[#121212] border border-white/10 rounded-sm space-y-3.5">
              <p className="text-xs font-semibold tracking-wider uppercase text-[#C5A059]">
                Primary Emergency Contact *
              </p>

              <div>
                <label
                  htmlFor="emg-pri-name"
                  className="block text-xs font-medium text-[#FAF9F6]/80 mb-1"
                >
                  Full Name *
                </label>
                <input
                  id="emg-pri-name"
                  type="text"
                  value={draft.emergencyProtocol.primaryContact.fullName}
                  onChange={(e) =>
                    updateEmergencyContact('primaryContact', 'fullName', e.target.value)
                  }
                  placeholder="Homeowner full name"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label
                  htmlFor="emg-pri-rel"
                  className="block text-xs font-medium text-[#FAF9F6]/80 mb-1"
                >
                  Role / Relationship
                </label>
                <input
                  id="emg-pri-rel"
                  type="text"
                  value={draft.emergencyProtocol.primaryContact.relationship}
                  onChange={(e) =>
                    updateEmergencyContact('primaryContact', 'relationship', e.target.value)
                  }
                  placeholder="e.g. Primary Homeowner · Travelling Mobile"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="emg-pri-phone"
                    className="block text-xs font-medium text-[#FAF9F6]/80 mb-1"
                  >
                    Phone / WhatsApp *
                  </label>
                  <input
                    id="emg-pri-phone"
                    type="tel"
                    value={draft.emergencyProtocol.primaryContact.phone}
                    onChange={(e) =>
                      updateEmergencyContact('primaryContact', 'phone', e.target.value)
                    }
                    placeholder="+27 82 000 0000"
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="emg-pri-email"
                    className="block text-xs font-medium text-[#FAF9F6]/80 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="emg-pri-email"
                    type="email"
                    value={draft.emergencyProtocol.primaryContact.email}
                    onChange={(e) =>
                      updateEmergencyContact('primaryContact', 'email', e.target.value)
                    }
                    placeholder="name@domain.co.za"
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>
            </div>

            {/* Secondary Emergency Contact */}
            <div className="p-5 bg-[#121212] border border-white/10 rounded-sm space-y-3.5">
              <p className="text-xs font-semibold tracking-wider uppercase text-[#FAF9F6]/75">
                Secondary Emergency Contact (Local Keyholder)
              </p>

              <div>
                <label
                  htmlFor="emg-sec-name"
                  className="block text-xs font-medium text-[#FAF9F6]/80 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="emg-sec-name"
                  type="text"
                  value={draft.emergencyProtocol.secondaryContact.fullName}
                  onChange={(e) =>
                    updateEmergencyContact('secondaryContact', 'fullName', e.target.value)
                  }
                  placeholder="Trusted neighbour or Pretoria relative"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label
                  htmlFor="emg-sec-rel"
                  className="block text-xs font-medium text-[#FAF9F6]/80 mb-1"
                >
                  Role / Relationship
                </label>
                <input
                  id="emg-sec-rel"
                  type="text"
                  value={draft.emergencyProtocol.secondaryContact.relationship}
                  onChange={(e) =>
                    updateEmergencyContact('secondaryContact', 'relationship', e.target.value)
                  }
                  placeholder="e.g. Neighbour / Spare Keyholder"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="emg-sec-phone"
                    className="block text-xs font-medium text-[#FAF9F6]/80 mb-1"
                  >
                    Phone / WhatsApp
                  </label>
                  <input
                    id="emg-sec-phone"
                    type="tel"
                    value={draft.emergencyProtocol.secondaryContact.phone}
                    onChange={(e) =>
                      updateEmergencyContact('secondaryContact', 'phone', e.target.value)
                    }
                    placeholder="+27 83 000 0000"
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="emg-sec-email"
                    className="block text-xs font-medium text-[#FAF9F6]/80 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="emg-sec-email"
                    type="email"
                    value={draft.emergencyProtocol.secondaryContact.email}
                    onChange={(e) =>
                      updateEmergencyContact('secondaryContact', 'email', e.target.value)
                    }
                    placeholder="keyholder@domain.co.za"
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#1A1A1A] border border-white/15 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Urgent Note & Notify Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1">
              <label
                htmlFor="emg-urgent-note"
                className="block text-xs font-semibold text-[#FAF9F6]/80 mb-1.5"
              >
                Urgent Assistance Context (Optional)
              </label>
              <input
                id="emg-urgent-note"
                type="text"
                value={draft.emergencyProtocol.urgentNote}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    emergencyProtocol: {
                      ...prev.emergencyProtocol,
                      urgentNote: e.target.value,
                    },
                  }))
                }
                placeholder="e.g. Urgent veterinary or residence maintenance callback required"
                className="w-full min-h-[46px] px-3.5 py-2.5 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <button
              type="button"
              onClick={handleTriggerUrgentNotify}
              disabled={isNotifying}
              className="inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-2.5 bg-[#C5A059] hover:bg-[#D4B26E] disabled:opacity-60 text-[#121212] font-semibold text-sm rounded-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <BellRing className="w-4 h-4 stroke-[2]" aria-hidden="true" />
              <span>{isNotifying ? 'Dispatching Alert…' : 'Notify'}</span>
            </button>
          </div>

          {emergencyError && (
            <p role="alert" className="text-xs sm:text-sm text-[#F87171]">
              {emergencyError}
            </p>
          )}

          {urgentAlertResult && (
            <div
              role="status"
              className="p-4 bg-[#121212] border border-[#C5A059]/60 rounded-sm space-y-2 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-[#FAF9F6] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A059]" aria-hidden="true" />
                  Urgent Assistance Alert Dispatched ({urgentAlertResult.alertId})
                </span>
                <span className="font-mono text-[11px] text-[#FAF9F6]/60">
                  {new Date(urgentAlertResult.dispatchedAtIso).toLocaleTimeString('en-ZA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  SAST
                </span>
              </div>
              <p className="text-[#FAF9F6]/75">
                Notified: {urgentAlertResult.notifiedRecipients.join(' · ')}
              </p>
              <a
                href={urgentAlertResult.whatsappEscalationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#C5A059] hover:text-[#D4B26E] font-semibold pt-1"
              >
                <span>Open Urgent WhatsApp Escalation Thread</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
