import React, { useState, useEffect } from 'react';
import {
  KitchenProfile,
  ParsedScenario,
  PlanEvaluation,
  EvidenceReceipt,
  KitchenContext,
  TemporaryDisruption,
  DisruptionProposalResponse,
  ConfirmedCustomerOrder,
  MenuPreparationPlan,
  MenuItemPreparationItem,
  CustomerOrderItem
} from '../types';
import {
  calculateReplan,
  interpretDisruption,
  fetchKitchenContext,
  extractDisruptionProposal,
  confirmDisruption,
  resolveDisruption,
  fetchCustomerOrders,
  recordCustomerOrder,
  cancelCustomerOrder,
  fetchMenuPlan
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
  RotateCcw,
  ChefHat,
  Flame,
  Utensils,
  Layers,
  Package,
  Plus,
  Trash2,
  HelpCircle,
  ShoppingBag
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
  const [expectedMeals, setExpectedMeals] = useState<number>(isRestaurant ? 70 : 350);
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

  // Realistic Menu-Based Demand & Confirmed Customer Orders State
  const [menuPlan, setMenuPlan] = useState<MenuPreparationPlan | null>(null);
  const [customerOrders, setCustomerOrders] = useState<ConfirmedCustomerOrder[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newOrderTable, setNewOrderTable] = useState('Table 5');
  const [newOrderPartySize, setNewOrderPartySize] = useState(2);
  const [newOrderDishId, setNewOrderDishId] = useState(isRestaurant ? 'recipe_verde_alfredo' : 'recipe_chana_masala');
  const [newOrderQuantity, setNewOrderQuantity] = useState(2);
  const [activeDecisionTab, setActiveDecisionTab] = useState<'cook_now' | 'prep_needed' | 'ingredients'>('cook_now');
  const [showWhyDetails, setShowWhyDetails] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadContext();
      loadLiveOrders();
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

  const loadLiveOrders = async () => {
    try {
      const orders = await fetchCustomerOrders(kitchen.id);
      setCustomerOrders(orders);
    } catch (err) {
      console.error('Error loading customer orders:', err);
    }
  };

  const refreshMenuPlan = async (currentExpectedGuests: number) => {
    try {
      const plan = await fetchMenuPlan(kitchen.id, currentExpectedGuests);
      setMenuPlan(plan);
      await loadLiveOrders();
    } catch (err) {
      console.error('Error refreshing menu plan:', err);
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
      await confirmDisruption({
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
      if (menuPlan) {
        await refreshMenuPlan(expectedMeals);
      }
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
      if (menuPlan) {
        await refreshMenuPlan(expectedMeals);
      }
    } catch (err: any) {
      alert(`Failed to resolve disruption: ${err.message}`);
    }
  };

  const handleCreateCustomerOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderDishId || newOrderQuantity <= 0) return;

    try {
      const recipeName =
        newOrderDishId === 'recipe_verde_alfredo' ? 'Creamy Garlic Fettuccine Alfredo' :
        newOrderDishId === 'recipe_verde_pomodoro' ? 'Rustic Tomato Pomodoro Penne' :
        newOrderDishId === 'recipe_verde_soup' ? 'Tuscan Tomato Basil Soup' :
        newOrderDishId === 'recipe_verde_dessert' ? 'Strawberries & Hand-Whipped Vanilla Cream' :
        newOrderDishId === 'recipe_verde_salad' ? 'Strawberry & Baby Spinach Salad' : 'Special Dish';

      await recordCustomerOrder(kitchen.id, {
        table_number: newOrderTable,
        party_size: newOrderPartySize,
        items: [
          {
            recipe_id: newOrderDishId,
            recipe_name: recipeName,
            quantity: newOrderQuantity
          }
        ],
        server_name: 'Staff Order Entry'
      });

      setShowOrderModal(false);
      await refreshMenuPlan(expectedMeals);
    } catch (err: any) {
      alert(`Failed to enter customer order: ${err.message}`);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelCustomerOrder(kitchen.id, orderId);
      await refreshMenuPlan(expectedMeals);
    } catch (err: any) {
      alert(`Failed to cancel order: ${err.message}`);
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

      // Extract or fetch realistic menu-based demand plan
      if (result.plans.plan_c.menu_preparation_plan) {
        setMenuPlan(result.plans.plan_c.menu_preparation_plan as MenuPreparationPlan);
      } else {
        await refreshMenuPlan(expectedMeals);
      }
      await loadLiveOrders();
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
      <div className="relative w-full max-w-3xl bg-vanilla rounded-3xl border border-subtle shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-espresso text-vanilla px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-terracotta/20 border border-terracotta/40 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-saffron" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-white">Plan My Food</h3>
                {menuPlan && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-saffron/20 text-saffron border border-saffron/30">
                    {menuPlan.service_model_label}
                  </span>
                )}
              </div>
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
            3. Recommended Food Plan
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

                {/* Quick Disruption Chips for testing any ingredient */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-subtle/50">
                  <span className="text-[11px] text-espresso/60 mr-1 font-medium">Quick Scenarios:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDisruptionText(isRestaurant ? 'Tomatoes are out of stock and unavailable for the next five days.' : 'Spinach delivery is delayed past lunch rush.');
                      setProposalResponse(null);
                    }}
                    className="px-2.5 py-1 text-[11px] rounded-lg border border-subtle bg-vanilla hover:bg-oat text-espresso transition"
                  >
                    {isRestaurant ? '🍅 Tomatoes Out of Stock' : '🥬 Spinach Delayed'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisruptionText(isRestaurant ? 'Fresh basil is unavailable due to supplier shortage.' : 'Chicken breast delivery delayed.');
                      setProposalResponse(null);
                    }}
                    className="px-2.5 py-1 text-[11px] rounded-lg border border-subtle bg-vanilla hover:bg-oat text-espresso transition"
                  >
                    {isRestaurant ? '🌿 Fresh Basil Unavailable' : '🍗 Chicken Delayed'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisruptionText(isRestaurant ? 'Heavy cream delivery delayed past dinner rush.' : 'Paneer supplier cannot deliver before lunch.');
                      setProposalResponse(null);
                    }}
                    className="px-2.5 py-1 text-[11px] rounded-lg border border-subtle bg-vanilla hover:bg-oat text-espresso transition"
                  >
                    {isRestaurant ? '🥛 Heavy Cream Delayed' : '🧀 Paneer Delayed'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisruptionText(isRestaurant ? 'Fresh strawberries are out of stock for 3 days.' : '50 staff working remotely.');
                      setProposalResponse(null);
                    }}
                    className="px-2.5 py-1 text-[11px] rounded-lg border border-subtle bg-vanilla hover:bg-oat text-espresso transition"
                  >
                    {isRestaurant ? '🍓 Strawberries Out of Stock' : '👥 Attendance Drop'}
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
                      <span className="text-[10px] text-white/80 block">86 all {proposalResponse.extracted_disruption.affected_name} recipes ({proposalResponse.extracted_disruption.affected_recipe_names.length} dishes)</span>
                    </button>
                    <button
                      type="button"
                      disabled={confirmingStatus === 'confirming'}
                      onClick={() => handleConfirmDisruption({ stock_depleted: false, supplier_halted: true })}
                      className="p-2.5 rounded-xl bg-oat border border-subtle text-espresso text-xs font-semibold hover:bg-subtle transition text-left"
                    >
                      <span className="font-bold block">Confirm: Future Outage Only</span>
                      <span className="text-[10px] text-espresso/70 block">Keep on-hand cooler batch of {proposalResponse.extracted_disruption.affected_name} active today</span>
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

          {/* STEP 3: Here's the recommended food plan (REALISTIC MENU-BASED DEMAND & PREPARATION INTELLIGENCE) */}
          {currentStep === 3 && activePlan && (
            <div className="space-y-6">
              {/* Header Context Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-oat/70 rounded-2xl border border-subtle">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-terracotta/10 border border-terracotta/20 flex items-center justify-center">
                    <Utensils className="w-4 h-4 text-terracotta" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-espresso">
                        {menuPlan?.service_period || kitchen.default_service_period}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-terracotta/10 text-terracotta border border-terracotta/20">
                        {menuPlan?.service_model_label || 'À La Carte (Cook-to-Order)'}
                      </span>
                    </div>
                    <span className="text-[11px] text-espresso/70">
                      Covers: <strong>{menuPlan?.expected_guests || expectedMeals}</strong> ({menuPlan?.confirmed_guests || Math.round(expectedMeals * 0.65)} reservations + {menuPlan?.walkin_guests || Math.round(expectedMeals * 0.35)} walk-ins)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-sage/10 text-sage border border-sage/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{menuPlan?.data_source_label || 'POS Sales History + Live Order Tickets'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(true)}
                    className="px-3 py-1 bg-espresso hover:bg-espresso/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5 text-saffron" />
                    <span>+ Table Order</span>
                  </button>
                </div>
              </div>

              {/* PRIMARY HERO: One Recommended Next Preparation Action (Requirement 5) */}
              <div className="p-4 sm:p-5 bg-vanilla border-2 border-saffron/50 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-terracotta" />
                  <span className="text-xs font-bold uppercase tracking-wider text-espresso">
                    Recommended Next Preparation Action
                  </span>
                </div>
                <p className="text-sm sm:text-base font-serif font-bold text-espresso leading-snug">
                  {menuPlan?.recommended_next_action || (
                    isRestaurant
                      ? 'Fire 2 Alfredo orders on saute station now for active tickets. 15 Pomodoro portions already safe in hot holding—do not cook more pasta until hot well drops below 5.'
                      : 'Prepare Stage 1 pre-service batch for confirmed attendance; stage cold reserve for walk-in surge.'
                  )}
                </p>
                <div className="flex items-center gap-4 pt-1 text-[11px] text-espresso/70">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-terracotta" />
                    <span>Action ready for immediate execution</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-sage" />
                    <span>HACCP thermal holding credit deducted</span>
                  </span>
                </div>
              </div>

              {/* THREE SEPARATE CHEF DECISIONS (Requirement 4) */}
              <div className="bg-white rounded-2xl border border-subtle shadow-xs overflow-hidden">
                <div className="grid grid-cols-3 bg-oat/50 border-b border-subtle text-xs font-bold text-espresso">
                  <button
                    type="button"
                    onClick={() => setActiveDecisionTab('cook_now')}
                    className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
                      activeDecisionTab === 'cook_now'
                        ? 'border-terracotta text-terracotta bg-white'
                        : 'border-transparent text-espresso/60 hover:text-espresso'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    <span>1. Cook Now ({menuPlan?.cook_now_summary.length || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDecisionTab('prep_needed')}
                    className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
                      activeDecisionTab === 'prep_needed'
                        ? 'border-terracotta text-terracotta bg-white'
                        : 'border-transparent text-espresso/60 hover:text-espresso'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>2. Preparation Needed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDecisionTab('ingredients')}
                    className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
                      activeDecisionTab === 'ingredients'
                        ? 'border-terracotta text-terracotta bg-white'
                        : 'border-transparent text-espresso/60 hover:text-espresso'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>3. Ingredients Needed</span>
                  </button>
                </div>

                <div className="p-4 text-xs">
                  {/* TAB 1: COOK NOW */}
                  {activeDecisionTab === 'cook_now' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-espresso">
                          Finished Dishes Justified Strictly by Live Orders & Service Rules
                        </span>
                        <span className="text-[10px] text-espresso/60">
                          Never cook unconfirmed walk-in forecasts
                        </span>
                      </div>

                      {menuPlan?.cook_now_summary && menuPlan.cook_now_summary.length > 0 ? (
                        <div className="space-y-2">
                          {menuPlan.cook_now_summary.map((cn, i) => (
                            <div key={i} className="p-3 bg-vanilla rounded-xl border border-terracotta/30 flex items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-espresso text-sm">{cn.recipe_name}</span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-terracotta text-white">
                                    FIRE {cn.cook_now_portions} NOW
                                  </span>
                                </div>
                                <p className="text-[11px] text-espresso/70 mt-0.5">{cn.reason}</p>
                              </div>
                              <span className="font-mono text-lg font-bold text-terracotta shrink-0">
                                {cn.cook_now_portions} portions
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-sage/10 rounded-xl border border-sage/30 text-sage text-center">
                          <strong>Zero hot fires needed right now.</strong> All current orders are covered by safe holding batches.
                        </div>
                      )}

                      {/* Explicitly explain holding credits for non-zero orders */}
                      {menuPlan?.menu_items.filter(m => m.already_prepared_portions > 0).map((held, idx) => (
                        <div key={idx} className="p-2.5 bg-oat/50 rounded-xl border border-subtle flex items-center justify-between text-[11px]">
                          <span className="text-espresso">
                            🛡️ <strong>{held.recipe_name}:</strong> {held.already_prepared_portions} portions safe in hot well ({held.confirmed_order_portions} ordered). Cook now = 0 to prevent waste.
                          </span>
                          <span className="font-semibold text-sage">Plate from well</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 2: PREPARATION NEEDED */}
                  {activeDecisionTab === 'prep_needed' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-espresso">
                          Advance Mise-en-place & Cold Station Staging
                        </span>
                        <span className="text-[10px] text-espresso/60">
                          Prepped cold to avoid cooked surplus
                        </span>
                      </div>
                      <div className="space-y-2">
                        {menuPlan?.menu_items.filter(item => !item.is_disrupted).map((item, idx) => (
                          <div key={idx} className="p-3 bg-vanilla rounded-xl border border-subtle">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-espresso">{item.recipe_name}</span>
                              <span className="text-[10px] font-mono font-semibold text-espresso/70">
                                Remaining Demand: {item.remaining_demand_portions} portions
                              </span>
                            </div>
                            <p className="text-[11px] text-espresso/80 font-medium">
                              {item.preparation_needed}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: INGREDIENTS NEEDED */}
                  {activeDecisionTab === 'ingredients' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-espresso">
                          Raw Stock Allocation for Forecast Demand ({menuPlan?.ingredients_needed_summary.length || 0} ingredients)
                        </span>
                        <span className="text-[10px] text-espresso/60">
                          Checked against verified on-hand inventory
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {menuPlan?.ingredients_needed_summary.map((ing, idx) => (
                          <div key={idx} className="p-2.5 bg-vanilla rounded-xl border border-subtle flex items-center justify-between">
                            <span className="font-medium text-espresso capitalize">{ing.ingredient_name}</span>
                            <span className="font-mono font-bold text-espresso">
                              {ing.quantity_required} {ing.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* MENU-ITEM DEMAND BREAKDOWN TABLE (Requirement 3: Separation of Demands) */}
              <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-espresso/70 block">
                      Menu-Item Demand Breakdown
                    </span>
                    <span className="text-[10px] text-espresso/60">
                      Disproves the 1-guest = 1-meal fallacy: accounts for courses, attach rates & shared dishes
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-terracotta">
                    {menuPlan?.total_dishes_ordered_count || 0} dishes ordered
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-subtle text-[10px] uppercase tracking-wider text-espresso/60 bg-oat/30">
                        <th className="py-2 px-2.5 font-bold">Menu Item</th>
                        <th className="py-2 px-2 text-center font-bold">Attach Rate</th>
                        <th className="py-2 px-2 text-center font-bold">Expected</th>
                        <th className="py-2 px-2 text-center font-bold text-terracotta">Confirmed</th>
                        <th className="py-2 px-2 text-center font-bold text-sage">Already Prepared</th>
                        <th className="py-2 px-2 text-center font-bold">Remaining</th>
                        <th className="py-2 px-2 text-right font-bold text-terracotta">Cook Now</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle/40">
                      {menuPlan?.menu_items.map((item) => (
                        <tr key={item.recipe_id} className={`hover:bg-vanilla/50 transition ${item.is_disrupted ? 'opacity-50 bg-red-50/20' : ''}`}>
                          <td className="py-2 px-2.5">
                            <div className="font-medium text-espresso flex items-center gap-1.5">
                              <span>{item.recipe_name}</span>
                              {item.is_shared_dish && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-saffron/20 text-espresso border border-saffron/30">
                                  Shared (÷{item.sharing_factor})
                                </span>
                              )}
                              {item.is_disrupted && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-100 text-red-700 font-bold">
                                  86'd
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-espresso/50 capitalize">{item.category}</span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-espresso/70">
                            {Math.round(item.attach_rate_per_guest * 100)}%
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-semibold text-espresso">
                            {item.expected_dish_demand}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-terracotta">
                            {item.confirmed_order_portions}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-sage">
                            {item.already_prepared_portions}
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-espresso/70">
                            {item.remaining_demand_portions}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-terracotta text-sm">
                            {item.cook_now_portions}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LIVE CUSTOMER ORDER TICKETS LIST */}
              {customerOrders.length > 0 && (
                <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-espresso/70 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Live Confirmed Order Tickets ({customerOrders.filter(o => o.status !== 'CANCELLED').length})
                    </span>
                    <span className="text-[10px] text-espresso/60">Entered by servers & host stand</span>
                  </div>

                  <div className="divide-y divide-subtle/50 text-xs">
                    {customerOrders.map((ord) => (
                      <div key={ord.order_id} className={`py-2 flex items-center justify-between gap-2 ${ord.status === 'CANCELLED' ? 'opacity-40 line-through' : ''}`}>
                        <div>
                          <div className="font-semibold text-espresso">
                            {ord.table_number || 'Walk-in Bar'} • Party of {ord.party_size} ({ord.timestamp})
                          </div>
                          <div className="text-[11px] text-espresso/70">
                            Items: {ord.items.map(it => `${it.quantity}x ${it.recipe_name}`).join(', ')} • Server: {ord.server_name || 'Staff'}
                          </div>
                        </div>

                        {ord.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(ord.order_id)}
                            className="px-2 py-1 text-[10px] text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded-lg transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Cancel Ticket</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WHY THIS WORKS (Requirement 5: Calculations and Assumptions) */}
              <div className="p-4 bg-oat/70 rounded-2xl border border-subtle shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-terracotta" />
                    <span className="text-xs font-bold text-espresso uppercase tracking-wider">
                      Why This Works (Calculations & Assumptions)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWhyDetails(!showWhyDetails)}
                    className="text-xs text-terracotta hover:underline font-semibold"
                  >
                    {showWhyDetails ? 'Hide Details' : 'View Assumptions'}
                  </button>
                </div>

                <p className="text-xs text-espresso/80 leading-relaxed">
                  {menuPlan?.why_this_works_explanation || (
                    `Under ${kitchen.name}'s service model, STILLGOOD models realistic dining behavior instead of assuming each guest orders one generic meal. Cook-Now recommendations are strictly anchored to confirmed ticket orders minus already-prepared safe holding batches, preventing overprep waste.`
                  )}
                </p>

                {showWhyDetails && menuPlan?.assumptions_breakdown && (
                  <div className="p-3 bg-white rounded-xl border border-subtle text-xs space-y-1.5 mt-2 animate-in fade-in">
                    <strong className="text-espresso block mb-1">Key Operational Assumptions:</strong>
                    {menuPlan.assumptions_breakdown.map((assump, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-espresso/70">
                        <Check className="w-3.5 h-3.5 text-sage shrink-0 mt-0.5" />
                        <span>{assump}</span>
                      </div>
                    ))}
                  </div>
                )}
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
                    <span>View Formal Evidence Receipt</span>
                  </button>
                )}

                {replanData?.plans && (
                  <button
                    type="button"
                    onClick={() => onOpenCompare(replanData.plans)}
                    className="px-3.5 py-1.5 bg-vanilla border border-subtle rounded-xl text-xs font-semibold text-espresso hover:bg-oat transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <GitCompare className="w-3.5 h-3.5 text-terracotta" />
                    <span>Compare Candidate Alternatives</span>
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
                  <span>Approve Preparation Sheet</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STAFF ORDER ENTRY MODAL DIALOG */}
      {showOrderModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-cocoa/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-vanilla rounded-2xl border border-subtle shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="font-serif text-base font-bold text-espresso flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-terracotta" />
                <span>Enter Table Order Ticket</span>
              </h5>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="text-espresso/60 hover:text-espresso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerOrder} className="space-y-3 text-xs">
              <div>
                <label className="text-espresso/70 block mb-1 font-semibold">Table / Seating Number</label>
                <input
                  type="text"
                  value={newOrderTable}
                  onChange={(e) => setNewOrderTable(e.target.value)}
                  className="w-full p-2 rounded-lg border border-subtle bg-white text-espresso"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-espresso/70 block mb-1 font-semibold">Party Size (Covers)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newOrderPartySize}
                    onChange={(e) => setNewOrderPartySize(parseInt(e.target.value) || 1)}
                    className="w-full p-2 rounded-lg border border-subtle bg-white text-espresso"
                  />
                </div>
                <div>
                  <label className="text-espresso/70 block mb-1 font-semibold">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newOrderQuantity}
                    onChange={(e) => setNewOrderQuantity(parseInt(e.target.value) || 1)}
                    className="w-full p-2 rounded-lg border border-subtle bg-white text-espresso"
                  />
                </div>
              </div>

              <div>
                <label className="text-espresso/70 block mb-1 font-semibold">Select Menu Dish</label>
                <select
                  value={newOrderDishId}
                  onChange={(e) => setNewOrderDishId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-subtle bg-white text-espresso"
                >
                  {isRestaurant ? (
                    <>
                      <option value="recipe_verde_alfredo">Creamy Garlic Fettuccine Alfredo (Main)</option>
                      <option value="recipe_verde_pomodoro">Rustic Tomato Pomodoro Penne (Main)</option>
                      <option value="recipe_verde_soup">Tuscan Tomato Basil Soup (Soup)</option>
                      <option value="recipe_verde_salad">Strawberry & Baby Spinach Salad (Appetizer)</option>
                      <option value="recipe_verde_dessert">Strawberries & Vanilla Cream (Dessert)</option>
                    </>
                  ) : (
                    <>
                      <option value="recipe_chana_masala">Amritsari Chana Masala</option>
                      <option value="recipe_palak_dal">Homestyle Palak Dal Tadka</option>
                      <option value="recipe_chicken_tikka">Murgh Tikka Masala</option>
                    </>
                  )}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-3 py-1.5 border border-subtle rounded-lg text-espresso hover:bg-oat"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-terracotta text-white font-semibold rounded-lg hover:bg-terracotta-dark shadow-xs"
                >
                  Submit Live Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
