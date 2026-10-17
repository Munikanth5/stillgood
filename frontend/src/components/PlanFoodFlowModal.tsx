import React, { useState, useEffect } from 'react';
import {
  KitchenProfile,
  ParsedScenario,
  PlanEvaluation,
  EvidenceReceipt,
  KitchenContext,
  TemporaryDisruption,
  DisruptionProposalResponse
} from '../types';
import {
  calculateReplan,
  interpretDisruption,
  fetchKitchenContext,
  extractDisruptionProposal,
  confirmDisruption,
  resolveDisruption
} from '../services/api';
import {
  CalendarCheck,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  FileText,
  GitCompare,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Clock,
  Info,
  Check,
  RotateCcw
} from 'lucide-react';

interface PlanFoodFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  kitchen: KitchenProfile;
  initialDisruptionText?: string;
  onPlanApproved: (plan: PlanEvaluation) => void;
  onOpenCompare: (plans: {
    plan_a: PlanEvaluation;
    plan_b: PlanEvaluation;
    plan_c: PlanEvaluation;
    rejected_candidates: PlanEvaluation[];
  }) => void;
  onOpenReceipt: (receipt: EvidenceReceipt) => void;
}

export const PlanFoodFlowModal: React.FC<PlanFoodFlowModalProps> = ({
  isOpen,
  onClose,
  kitchen,
  initialDisruptionText = '',
  onPlanApproved,
  onOpenCompare,
  onOpenReceipt
}) => {
  const isRestaurant = kitchen.type === 'restaurant_cafe';
  const baselineMeals = isRestaurant ? 120 : (kitchen.capacity_meals_per_service || 500);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [expectedMeals, setExpectedMeals] = useState<number>(isRestaurant ? 105 : 350);
  const [disruptionText, setDisruptionText] = useState<string>(initialDisruptionText);
  const [minVegPortions, setMinVegPortions] = useState<number>(isRestaurant ? 35 : 120);

  // Dynamic Kitchen Context & Disruption State (PART 1)
  const [context, setContext] = useState<KitchenContext | null>(null);
  const [activeDisruptions, setActiveDisruptions] = useState<TemporaryDisruption[]>([]);
  const [analyzingDisruption, setAnalyzingDisruption] = useState(false);
  const [proposalResponse, setProposalResponse] = useState<DisruptionProposalResponse | null>(null);
  const [confirmingStatus, setConfirmingStatus] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [replanData, setReplanData] = useState<{
    scenario: ParsedScenario;
    plans: {
      plan_a: PlanEvaluation;
      plan_b: PlanEvaluation;
      plan_c: PlanEvaluation;
      rejected_candidates: PlanEvaluation[];
    };
    evidence_receipt: EvidenceReceipt;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadContext();
    }
  }, [isOpen, kitchen.id]);

  useEffect(() => {
    if (initialDisruptionText) {
      setDisruptionText(initialDisruptionText);
      setCurrentStep(2);
    }
  }, [initialDisruptionText, isOpen]);

  const loadContext = async () => {
    try {
      const ctx = await fetchKitchenContext(kitchen.id);
      setContext(ctx);
      setActiveDisruptions(ctx.active_disruptions);
    } catch (err) {
      console.error('Error loading kitchen context:', err);
    }
  };

  const handleAnalyzeDisruption = async () => {
    if (!disruptionText.trim()) return;
    setAnalyzingDisruption(true);
    try {
      const prop = await extractDisruptionProposal(disruptionText.trim(), kitchen.id);
      setProposalResponse(prop);
    } catch (err: any) {
      alert(`Error extracting disruption: ${err.message}`);
    } finally {
      setAnalyzingDisruption(false);
    }
  };

  const handleConfirmDisruption = async (option: { stock_depleted: boolean; supplier_halted: boolean }) => {
    if (!proposalResponse) return;
    setConfirmingStatus('confirming');
    try {
      const updated = await confirmDisruption({
        disruption_id: proposalResponse.extracted_disruption.id,
        confirmed: true,
        stock_depleted: option.stock_depleted,
        supplier_halted: option.supplier_halted,
        notes: `Confirmed by manager via Kitchen Companion planning flow.`
      });
      await loadContext();
      setProposalResponse(null);
      setConfirmingStatus('confirmed');
      setTimeout(() => setConfirmingStatus(null), 3000);
    } catch (err: any) {
      alert(`Failed to confirm disruption: ${err.message}`);
      setConfirmingStatus(null);
    }
  };

  const handleResolveDisruption = async (disruptionId: string) => {
    try {
      await resolveDisruption({
        disruption_id: disruptionId,
        delivery_received: true,
        stock_replenished_qty: 8.0,
        notes: 'Delivery received and verified in stock.'
      });
      await loadContext();
    } catch (err: any) {
      alert(`Failed to resolve disruption: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      let fullText = disruptionText.trim();
      if (!fullText) {
        fullText = `Target meal count is revised to ${expectedMeals} meals. Guarantee at least ${minVegPortions} vegetarian portions.`;
      }

      const scenario = await interpretDisruption(fullText, kitchen.id);
      scenario.revised_expected_meals = expectedMeals;
      scenario.dietary_constraints = [{ tag: 'vegetarian', min_meals: Math.min(minVegPortions, expectedMeals) }];

      const result = await calculateReplan(scenario);
      setReplanData(result);
      setCurrentStep(3);
    } catch (err: any) {
      alert(`Error calculating plan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const activePlan = replanData?.plans.plan_c || null;
  const originalMeals = baselineMeals;
  const diffMeals = activePlan ? (activePlan.total_portions - originalMeals) : (expectedMeals - originalMeals);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-cocoa/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-vanilla rounded-3xl border border-subtle shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-espresso text-vanilla px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-terracotta/20 border border-terracotta/40 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-saffron" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">Plan My Food</h3>
              <p className="text-xs text-vanilla/70">
                Step {currentStep} of 3 • {kitchen.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 text-vanilla/80 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="grid grid-cols-3 bg-oat border-b border-subtle text-xs font-semibold">
          <button
            onClick={() => setCurrentStep(1)}
            className={`py-3 text-center border-b-2 transition ${
              currentStep === 1
                ? 'border-terracotta text-espresso bg-white/40'
                : 'border-transparent text-espresso/60'
            }`}
          >
            1. Expected Guests
          </button>
          <button
            onClick={() => setCurrentStep(2)}
            className={`py-3 text-center border-b-2 transition ${
              currentStep === 2
                ? 'border-terracotta text-espresso bg-white/40'
                : 'border-transparent text-espresso/60'
            }`}
          >
            2. What Has Changed?
          </button>
          <button
            onClick={() => replanData && setCurrentStep(3)}
            disabled={!replanData}
            className={`py-3 text-center border-b-2 transition ${
              currentStep === 3
                ? 'border-terracotta text-espresso bg-white/40'
                : 'border-transparent text-espresso/60'
            }`}
          >
            3. Recommended Plan
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: How many guests do you expect? (Directives 4 & 5: NO SLIDERS) */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-serif text-xl font-bold text-espresso">
                  How many guests do you expect?
                </h4>
                <p className="text-xs text-espresso/70 mt-1">
                  Adjust expected covers for today's service.
                </p>
              </div>

              {/* Number Stepper Control */}
              <div className="p-6 bg-white rounded-2xl border border-subtle shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-espresso/70 block">
                      Target Guests Today
                    </label>
                    <span className="text-xs text-espresso/60">
                      {isRestaurant ? 'Bookings + Walk-ins' : 'Total Service Headcount'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-espresso/50 block">Standard Baseline</span>
                    <span className="text-xs font-mono font-bold text-espresso">
                      {baselineMeals} covers
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 py-2">
                  <button
                    type="button"
                    onClick={() => setExpectedMeals(Math.max(10, expectedMeals - (isRestaurant ? 5 : 25)))}
                    className="w-12 h-12 rounded-xl bg-oat border border-subtle hover:bg-subtle text-espresso font-serif text-2xl font-bold transition flex items-center justify-center active:scale-95 shadow-xs"
                  >
                    -
                  </button>
                  <div className="relative">
                    <input
                      type="number"
                      min={10}
                      max={isRestaurant ? 220 : 1000}
                      value={expectedMeals}
                      onChange={(e) => setExpectedMeals(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-36 text-center text-3xl font-serif font-bold text-espresso bg-vanilla/40 border border-subtle rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-terracotta"
                    />
                    <span className="absolute -bottom-4 left-0 right-0 text-[10px] text-center text-espresso/50">
                      Type exact value
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpectedMeals(expectedMeals + (isRestaurant ? 5 : 25))}
                    className="w-12 h-12 rounded-xl bg-oat border border-subtle hover:bg-subtle text-espresso font-serif text-2xl font-bold transition flex items-center justify-center active:scale-95 shadow-xs"
                  >
                    +
                  </button>
                </div>

                {/* Quick adjustment buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs text-espresso/60 mr-1">Quick Scenarios:</span>
                  <button
                    type="button"
                    onClick={() => setExpectedMeals(isRestaurant ? 70 : Math.round(baselineMeals * 0.7))}
                    className="px-3 py-1 text-xs rounded-lg border border-subtle bg-vanilla hover:bg-oat text-espresso transition"
                  >
                    {isRestaurant ? 'Bookings Only (70)' : '-30% Drop (350)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpectedMeals(isRestaurant ? 105 : baselineMeals)}
                    className="px-3 py-1 text-xs rounded-lg border border-subtle bg-vanilla hover:bg-oat text-espresso transition font-bold"
                  >
                    {isRestaurant ? 'Bookings + Walk-ins (105)' : `Baseline (${baselineMeals})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpectedMeals(Math.round(baselineMeals * 1.15))}
                    className="px-3 py-1 text-xs rounded-lg border border-subtle bg-vanilla hover:bg-oat text-espresso transition"
                  >
                    Surge (+15%)
                  </button>
                </div>
              </div>

              {/* Step 1 Footer CTA */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2.5 bg-terracotta hover:bg-terracotta-dark text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <span>Continue to What Has Changed</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: What has changed? (Dynamic Kitchen Context & Gemini Disruption Lifecycle) */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h4 className="font-serif text-xl font-bold text-espresso">
                  What has changed?
                </h4>
                <p className="text-xs text-espresso/70 mt-1">
                  Tell STILLGOOD what happened. Active disruptions and verified policies will shape your plan.
                </p>
              </div>

              {/* 1. Persistent Kitchen Policy & Operational Facts Banner */}
              {context && (
                <div className="p-3.5 bg-oat/70 rounded-2xl border border-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sage shrink-0" />
                    <div>
                      <span className="font-bold text-espresso block">
                        Persistent Policy (v{context.policy.version})
                      </span>
                      <span className="text-[11px] text-espresso/70">
                        {context.policy.approved_safety_policy} • Capacity: {context.policy.capacity_meals_per_service} covers
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-espresso/80">
                    <span>At-Risk Stock: <strong>{context.operational_facts.at_risk_inventory_kg} kg</strong></span>
                    <span>Reservations: <strong>{context.operational_facts.confirmed_reservations}</strong></span>
                  </div>
                </div>
              )}

              {/* 2. Active Confirmed Disruptions */}
              {activeDisruptions.length > 0 && (
                <div className="p-4 bg-vanilla rounded-2xl border border-terracotta/30 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-terracotta flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Active Confirmed Disruptions ({activeDisruptions.length})
                    </span>
                    <span className="text-[10px] text-espresso/60">Persistent across services</span>
                  </div>
                  <div className="divide-y divide-subtle/50 text-xs">
                    {activeDisruptions.map((disr) => (
                      <div key={disr.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-espresso capitalize">
                            {disr.affected_name} — {disr.issue_type.replace('_', ' ')} ({disr.duration_days} days)
                          </div>
                          <div className="text-[11px] text-espresso/70">
                            Dates: {disr.start_date} to {disr.end_date} • 86'd recipes: {disr.affected_recipe_names.join(', ')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleResolveDisruption(disr.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-sage/10 text-sage hover:bg-sage hover:text-white border border-sage/20 transition flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Resolve / Restock</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Natural Language Disruption Input */}
              <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-espresso/70 block">
                    Describe In Plain Words
                  </label>
                  <span className="text-[10px] text-espresso/50">Google Gemini Extraction</span>
                </div>
                <textarea
                  rows={2}
                  value={disruptionText}
                  onChange={(e) => setDisruptionText(e.target.value)}
                  placeholder={
                    isRestaurant
                      ? 'e.g. Strawberries are out of stock and unavailable for the next five days.'
                      : 'e.g. 150 staff working remotely tomorrow; paneer delivery delayed past lunch rush.'
                  }
                  className="w-full p-3 text-xs rounded-xl border border-subtle bg-vanilla text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-espresso/60">
                    STILLGOOD requires confirmation before mutating recipes or inventory.
                  </span>
                  <button
                    type="button"
                    disabled={analyzingDisruption || !disruptionText.trim()}
                    onClick={handleAnalyzeDisruption}
                    className="px-3 py-1.5 bg-oat hover:bg-subtle text-espresso text-xs font-semibold rounded-xl border border-subtle transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-saffron ${analyzingDisruption ? 'animate-spin' : ''}`} />
                    <span>{analyzingDisruption ? 'Extracting...' : 'Verify Disruption'}</span>
                  </button>
                </div>
              </div>

              {/* 4. Manager Confirmation Card (Extracted Proposal) */}
              {proposalResponse && (
                <div className="p-4 bg-vanilla border-2 border-saffron/40 rounded-2xl shadow-md space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-terracotta shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-espresso uppercase tracking-wider block">
                        Gemini Extraction • Manager Confirmation Needed
                      </span>
                      <p className="text-xs text-espresso/80">
                        {proposalResponse.clarification_message}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/80 rounded-xl border border-subtle text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-espresso/60">Affected Ingredient:</span>
                      <strong className="text-espresso capitalize">{proposalResponse.extracted_disruption.affected_name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-espresso/60">Issue & Duration:</span>
                      <strong className="text-espresso">{proposalResponse.extracted_disruption.issue_type.replace('_', ' ')} • {proposalResponse.extracted_disruption.duration_days} days</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-espresso/60">Affected Recipes (to 86):</span>
                      <strong className="text-espresso">{proposalResponse.extracted_disruption.affected_recipe_names.join(', ') || 'None identified'}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-espresso/80 italic">
                    {proposalResponse.confirmation_prompt}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      disabled={confirmingStatus === 'confirming'}
                      onClick={() => handleConfirmDisruption({ stock_depleted: true, supplier_halted: true })}
                      className="p-2.5 rounded-xl bg-terracotta text-white text-xs font-semibold hover:bg-terracotta-dark transition text-left"
                    >
                      <span className="font-bold block">Confirm: Stock Depleted</span>
                      <span className="text-[10px] text-white/80 block">86 all strawberry recipes across service dates</span>
                    </button>
                    <button
                      type="button"
                      disabled={confirmingStatus === 'confirming'}
                      onClick={() => handleConfirmDisruption({ stock_depleted: false, supplier_halted: true })}
                      className="p-2.5 rounded-xl bg-oat border border-subtle text-espresso text-xs font-semibold hover:bg-subtle transition text-left"
                    >
                      <span className="font-bold block">Confirm: Future Outage Only</span>
                      <span className="text-[10px] text-espresso/70 block">Keep verified on-hand cooler batch active today</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 5. Dietary Protection Stepper */}
              <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-espresso block">
                    Guaranteed Vegetarian Meals
                  </span>
                  <span className="text-[11px] text-espresso/70">
                    Protected by persistent kitchen policy
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMinVegPortions(Math.max(10, minVegPortions - 5))}
                    className="w-7 h-7 rounded-lg border border-subtle bg-vanilla text-xs font-bold hover:bg-oat"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={minVegPortions}
                    onChange={(e) => setMinVegPortions(parseInt(e.target.value) || 0)}
                    className="w-14 px-1 py-1 text-center text-xs font-bold font-serif border border-subtle rounded-lg bg-vanilla"
                  />
                  <button
                    type="button"
                    onClick={() => setMinVegPortions(minVegPortions + 5)}
                    className="w-7 h-7 rounded-lg border border-subtle bg-vanilla text-xs font-bold hover:bg-oat"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Step 2 Footer Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-subtle text-espresso text-xs font-semibold rounded-xl hover:bg-oat transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGeneratePlan}
                  className="px-6 py-2.5 bg-terracotta hover:bg-terracotta-dark text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Evaluating Options...' : 'Generate Recommended Food Plan'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Here's the recommended food plan. */}
          {currentStep === 3 && activePlan && (
            <div className="space-y-6">
              <div>
                <h4 className="font-serif text-xl font-bold text-espresso">
                  Here's your recommended food plan.
                </h4>
                <p className="text-xs text-espresso/70 mt-1">
                  Calculated against your kitchen constraints and available verified stock.
                </p>
              </div>

              {/* Short comparison box (Directive 5) */}
              <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-espresso/70 block">
                  Service Meal Comparison
                </span>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-vanilla rounded-xl border border-subtle">
                    <span className="text-[10px] text-espresso/60 uppercase block">Previously Planned</span>
                    <span className="font-serif text-xl font-bold text-espresso mt-0.5 block">
                      {originalMeals}
                    </span>
                    <span className="text-[10px] text-espresso/60">meals</span>
                  </div>

                  <div className="p-3 bg-vanilla rounded-xl border border-subtle">
                    <span className="text-[10px] text-espresso/60 uppercase block">Recommended Now</span>
                    <span className="font-serif text-xl font-bold text-terracotta mt-0.5 block">
                      {activePlan.total_portions}
                    </span>
                    <span className="text-[10px] text-espresso/60">meals</span>
                  </div>

                  <div className="p-3 bg-vanilla rounded-xl border border-subtle">
                    <span className="text-[10px] text-espresso/60 uppercase block">Difference</span>
                    <span
                      className={`font-serif text-xl font-bold mt-0.5 flex items-center justify-center gap-1 ${
                        diffMeals < 0 ? 'text-sage' : 'text-espresso'
                      }`}
                    >
                      {diffMeals < 0 ? (
                        <>
                          <TrendingDown className="w-4 h-4" />
                          <span>{Math.abs(diffMeals)} fewer</span>
                        </>
                      ) : diffMeals > 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4" />
                          <span>+{diffMeals} more</span>
                        </>
                      ) : (
                        <span>Same</span>
                      )}
                    </span>
                    <span className="text-[10px] text-espresso/60">planned meals</span>
                  </div>
                </div>

                {/* One sentence explanation */}
                <div className="p-3 bg-oat rounded-xl border border-subtle text-xs text-espresso/80">
                  <strong>Why this changed:</strong> {activePlan.why_gemini_suggested || activePlan.subtitle || activePlan.summary_explanation}
                </div>

                <div className="text-[10px] text-espresso/50 italic text-center">
                  Notice: Reduced preparation avoids over-prep before cooking; actual waste reduction is measured after service.
                </div>
              </div>

              {/* Planned Menu Items Summary */}
              <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-espresso/70 block">
                  Planned Dish Portions ({activePlan.planned_items.length} items)
                </span>
                <div className="divide-y divide-subtle/50 text-xs">
                  {activePlan.planned_items.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <span className="font-medium text-espresso">{item.recipe_name}</span>
                      <span className="font-mono font-bold text-espresso">{item.portions} portions</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secondary Navigation (Why this works & Compare other options) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {replanData?.evidence_receipt && (
                  <button
                    type="button"
                    onClick={() => onOpenReceipt(replanData.evidence_receipt)}
                    className="text-xs text-espresso/80 hover:text-terracotta underline flex items-center gap-1.5 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Why this works (Evidence Receipt)</span>
                  </button>
                )}

                {replanData?.plans && (
                  <button
                    type="button"
                    onClick={() => onOpenCompare(replanData.plans)}
                    className="px-3.5 py-1.5 bg-vanilla border border-subtle rounded-xl text-xs font-semibold text-espresso hover:bg-oat transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <GitCompare className="w-3.5 h-3.5 text-terracotta" />
                    <span>Compare other options</span>
                  </button>
                )}
              </div>

              {/* Step 3 Footer Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 border border-subtle text-espresso text-xs font-semibold rounded-xl hover:bg-oat transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Adjust Inputs</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onPlanApproved(activePlan);
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-terracotta hover:bg-terracotta-dark text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Review & Approve Plan</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
