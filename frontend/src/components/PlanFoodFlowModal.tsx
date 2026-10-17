import React, { useState, useEffect } from 'react';
import {
  KitchenProfile,
  ParsedScenario,
  PlanEvaluation,
  EvidenceReceipt
} from '../types';
import { calculateReplan, interpretDisruption } from '../services/api';
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
  Clock
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
  const baselineMeals = kitchen.capacity_meals_per_service || (isRestaurant ? 120 : 500);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [expectedMeals, setExpectedMeals] = useState<number>(isRestaurant ? 105 : 350);
  const [disruptionText, setDisruptionText] = useState<string>(initialDisruptionText);
  const [supplierDelayed, setSupplierDelayed] = useState<boolean>(true);
  const [prioritizeExpiring, setPrioritizeExpiring] = useState<boolean>(true);
  const [minVegPortions, setMinVegPortions] = useState<number>(isRestaurant ? 35 : 120);

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
    if (initialDisruptionText) {
      setDisruptionText(initialDisruptionText);
      setCurrentStep(2);
    }
  }, [initialDisruptionText, isOpen]);

  if (!isOpen) return null;

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      // Build natural language scenario prompt
      let fullText = disruptionText.trim();
      if (!fullText) {
        fullText = `Target meal count is revised to ${expectedMeals} meals. `;
        if (supplierDelayed) {
          fullText += isRestaurant
            ? 'The Country Fresh Dairy supplier is delayed; no heavy cream before dinner service. '
            : 'The paneer supplier cannot deliver before lunch service. ';
        }
        if (prioritizeExpiring) {
          fullText += isRestaurant
            ? 'Prioritize using at-risk fresh strawberries in dessert reserve. '
            : 'Prioritize using near-expiry fresh spinach batches. ';
        }
        fullText += `Guarantee at least ${minVegPortions} vegetarian portions.`;
      }

      const scenario = await interpretDisruption(fullText, kitchen.id);
      scenario.revised_expected_meals = expectedMeals;

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
  const diffMeals = expectedMeals - originalMeals;

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

        {/* Modal Body */}
        <div className="p-6 text-espresso font-sans">
          {/* STEP 1: How many guests do you expect? */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-serif text-xl font-bold text-espresso">
                  How many guests do you expect today?
                </h4>
                <p className="text-xs text-espresso/70 mt-1">
                  Enter your expected attendance or dining covers. No confusing sliders—type an exact number or tap plus/minus.
                </p>
              </div>

              {/* Number input with - and + */}
              <div className="p-6 bg-white rounded-2xl border border-subtle shadow-xs space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-espresso/70 block">
                  {isRestaurant ? 'Expected Dinner Covers' : 'Expected Meals to Serve'}
                </span>

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
                      max={baselineMeals * 2}
                      value={expectedMeals}
                      onChange={(e) => setExpectedMeals(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-36 text-center font-serif text-4xl font-bold text-espresso border-2 border-subtle rounded-2xl py-2 px-3 bg-vanilla focus:border-terracotta focus:outline-none"
                    />
                    <span className="text-[11px] text-espresso/60 block text-center mt-1">
                      {isRestaurant ? 'covers' : 'meals'}
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
                    onClick={() => setExpectedMeals(Math.round(baselineMeals * 0.7))}
                    className="px-3 py-1 text-xs rounded-lg border border-subtle bg-vanilla hover:bg-oat text-espresso transition"
                  >
                    -30% Drop ({Math.round(baselineMeals * 0.7)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpectedMeals(baselineMeals)}
                    className="px-3 py-1 text-xs rounded-lg border border-subtle bg-vanilla hover:bg-oat text-espresso transition"
                  >
                    Baseline ({baselineMeals})
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpectedMeals(Math.round(baselineMeals * 1.15))}
                    className="px-3 py-1 text-xs rounded-lg border border-subtle bg-vanilla hover:bg-oat text-espresso transition"
                  >
                    +15% Surge ({Math.round(baselineMeals * 1.15)})
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
                  <span>Next: What has changed?</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: What has changed? */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-serif text-xl font-bold text-espresso">
                  What has changed in your kitchen today?
                </h4>
                <p className="text-xs text-espresso/70 mt-1">
                  Tell STILLGOOD about cancellations, missing supplier deliveries, or dietary rules.
                </p>
              </div>

              <div className="space-y-4">
                {/* Natural language disruption description */}
                <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-espresso/70 block">
                    Describe In Plain Words (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={disruptionText}
                    onChange={(e) => setDisruptionText(e.target.value)}
                    placeholder={
                      isRestaurant
                        ? 'e.g. 40 dinner reservations cancelled due to rain; dairy truck delayed; prioritize fresh strawberries.'
                        : 'e.g. 150 staff working remotely tomorrow; paneer delivery delayed past lunch rush.'
                    }
                    className="w-full p-3 text-xs rounded-xl border border-subtle bg-vanilla text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
                  />
                </div>

                {/* Quick toggle chips */}
                <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-espresso/70 block">
                    Kitchen Constraints
                  </span>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-vanilla/60 border border-subtle cursor-pointer hover:bg-vanilla">
                    <div>
                      <span className="text-xs font-semibold text-espresso block">
                        {isRestaurant ? 'Key Dairy Delivery Delayed' : 'Core Supplier Delayed'}
                      </span>
                      <span className="text-[11px] text-espresso/70">
                        {isRestaurant ? 'Country Fresh Dairy cream delayed past prep cutoff' : 'Paneer delayed past lunch'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={supplierDelayed}
                      onChange={(e) => setSupplierDelayed(e.target.checked)}
                      className="rounded text-terracotta focus:ring-terracotta"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-vanilla/60 border border-subtle cursor-pointer hover:bg-vanilla">
                    <div>
                      <span className="text-xs font-semibold text-espresso block">
                        Prioritize At-Risk Inventory
                      </span>
                      <span className="text-[11px] text-espresso/70">
                        Allocate ingredients near safe shelf-life cutoff first (FEFO)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={prioritizeExpiring}
                      onChange={(e) => setPrioritizeExpiring(e.target.checked)}
                      className="rounded text-sage focus:ring-sage"
                    />
                  </label>

                  <div className="p-3 rounded-xl bg-vanilla/60 border border-subtle flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-espresso block">
                        Guaranteed Vegetarian Meals
                      </span>
                      <span className="text-[11px] text-espresso/70">
                        Minimum portions strictly protected
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMinVegPortions(Math.max(10, minVegPortions - 5))}
                        className="w-6 h-6 rounded border border-subtle bg-white text-xs font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={minVegPortions}
                        onChange={(e) => setMinVegPortions(parseInt(e.target.value) || 0)}
                        className="w-14 px-1 py-0.5 text-center text-xs font-bold font-serif border border-subtle rounded bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setMinVegPortions(minVegPortions + 5)}
                        className="w-6 h-6 rounded border border-subtle bg-white text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
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
                  <strong>Why this changed:</strong> {activePlan.summary_explanation}
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

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenReceipt(replanData.evidence_receipt)}
                    className="text-xs text-espresso/70 hover:text-espresso flex items-center gap-1.5 transition underline-offset-4 hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Why this works (Evidence Receipt)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenCompare(replanData.plans)}
                    className="px-4 py-2 border border-subtle text-espresso text-xs font-semibold rounded-xl hover:bg-oat transition flex items-center gap-1.5"
                  >
                    <GitCompare className="w-3.5 h-3.5 text-terracotta" />
                    <span>Compare other options</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-subtle">
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
                    <span>Review &amp; Approve Plan</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default PlanFoodFlowModal;
