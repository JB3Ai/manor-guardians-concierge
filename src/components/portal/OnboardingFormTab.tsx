import { FormEvent, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  PawPrint,
  Plus,
  Shield,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { saveEstateOnboardingDossier } from '../../services/apiPlaceholders';
import {
  EstateOnboardingDossier,
  PetOnboardingProfile,
} from '../../types/concierge';

interface OnboardingFormTabProps {
  dossier: EstateOnboardingDossier;
  onSaveDossier: (saved: EstateOnboardingDossier) => void;
  onSwitchToLiveStay: () => void;
}

type OnboardingStep = 1 | 2 | 3;

const STEP_META = [
  { step: 1 as const, label: '01. Property & Security', icon: Shield },
  { step: 2 as const, label: '02. Pet Profiles', icon: PawPrint },
  { step: 3 as const, label: '03. “Welcome Home” Reset', icon: Sparkles },
];

export function OnboardingFormTab({
  dossier,
  onSaveDossier,
  onSwitchToLiveStay,
}: OnboardingFormTabProps) {
  const [draft, setDraft] = useState<EstateOnboardingDossier>(dossier);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<{
    dossierId: string;
    savedAtLabel: string;
  } | null>(null);

  const updateField = <K extends keyof EstateOnboardingDossier>(
    key: K,
    value: EstateOnboardingDossier[K]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
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
      if (draft.estateNameAndAddress.trim().length < 4) {
        stepErrors.push('Please enter your Estate Name & Street Address.');
      }
      if (draft.gateAccessProcedure.trim().length < 4) {
        stepErrors.push('Please specify your gate access / biometric procedure.');
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
      const response = await saveEstateOnboardingDossier(draft);
      const savedRecord: EstateOnboardingDossier = {
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

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Rail: Multi-Step Progress & Supabase Dossier Status */}
      <aside className="lg:col-span-4 bg-[#1A1A1A] border border-white/10 rounded-sm p-6 space-y-6">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#C5A059] mb-1">
            Confirmed Client Intake
          </p>
          <h3 className="font-display text-2xl font-medium text-[#FAF9F6]">
            Digital Estate Dossier
          </h3>
          <p className="text-xs sm:text-sm text-[#FAF9F6]/65 mt-2 leading-relaxed">
            Complete all three onboarding sections prior to departure. Your assigned Senior
            Guardian reviews every protocol before key handover.
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
                  Synced at {savedNotice.savedAtLabel} SAST · Ready for guardian handover
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

      {/* Right Panel: Multi-Step Form */}
      <form
        onSubmit={handleSubmitDossier}
        noValidate
        className="lg:col-span-8 bg-[#1A1A1A] border border-white/10 rounded-sm p-6 sm:p-8 space-y-6"
      >
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="pb-4 border-b border-white/10">
              <h4 className="font-display text-2xl font-medium text-[#FAF9F6]">
                01. Property &amp; Security Protocols
              </h4>
              <p className="text-xs sm:text-sm text-[#FAF9F6]/65 mt-1">
                Estate access, armed response credentials, and utility shut-off locations.
              </p>
            </div>

            <div>
              <label
                htmlFor="onb-address"
                className="block text-xs font-semibold tracking-wide text-[#FAF9F6]/85 mb-1.5"
              >
                Estate Name &amp; Physical Address *
              </label>
              <input
                id="onb-address"
                type="text"
                value={draft.estateNameAndAddress}
                onChange={(e) => updateField('estateNameAndAddress', e.target.value)}
                placeholder="e.g. 18 Rigel Avenue North, Waterkloof Ridge, Pretoria"
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label
                htmlFor="onb-gate"
                className="block text-xs font-semibold tracking-wide text-[#FAF9F6]/85 mb-1.5"
              >
                Gate Access &amp; Estate Biometric Procedure *
              </label>
              <textarea
                id="onb-gate"
                rows={2}
                value={draft.gateAccessProcedure}
                onChange={(e) => updateField('gateAccessProcedure', e.target.value)}
                placeholder="Intercom code, MyEstate visitor PIN, guardhouse clearance instructions"
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
                placeholder="Exact location of main water valve, electrical DB board, and solar/generator changeover"
                className="w-full px-3.5 py-2.5 text-sm bg-[#121212] border border-white/20 rounded-sm text-[#FAF9F6] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label
                htmlFor="onb-quirks"
                className="block text-xs font-semibold tracking-wide text-[#FAF9F6]/85 mb-1.5"
              >
                House Quirks (Pool Pump, Alarm Zones, Irrigation)
              </label>
              <textarea
                id="onb-quirks"
                rows={2}
                value={draft.houseQuirks}
                onChange={(e) => updateField('houseQuirks', e.target.value)}
                placeholder="Pool pump hours, bypassed garden beams, sensitive locks or irrigation timers"
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
                  Add an individual care profile for each dog or pet in residence.
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
                          handleUpdatePet(pet.id, 'feedingScheduleAndPortions', e.target.value)
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
                        Behavioral Notes &amp; Thunderstorm Routine
                      </label>
                      <input
                        type="text"
                        value={pet.behavioralNotes}
                        onChange={(e) =>
                          handleUpdatePet(pet.id, 'behavioralNotes', e.target.value)
                        }
                        placeholder="Leash preferences, sleeping quarters, storm calming instructions"
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
                03. “Welcome Home” Reset Preferences
              </h4>
              <p className="text-xs sm:text-sm text-[#FAF9F6]/65 mt-1">
                Specify your arrival timing, fridge provisioning list, and linen preferences.
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
                Essential Groceries to Stock in the Fridge
              </label>
              <textarea
                id="onb-groceries"
                rows={3}
                value={draft.fridgeGroceryList}
                onChange={(e) => updateField('fridgeGroceryList', e.target.value)}
                placeholder="Milk type, artisan bread, coffee beans, farm butter, sparkling water, fresh fruit"
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
                {isSaving ? 'Saving Estate Dossier…' : 'Save Estate & Pet Onboarding'}
              </span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
