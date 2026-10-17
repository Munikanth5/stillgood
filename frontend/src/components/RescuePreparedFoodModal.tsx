import React, { useState, useEffect } from 'react';
import {
  PreparedFoodBatch,
  PreparedFoodIntakeRequest,
  SafetyDecision,
  RecommendedRescueAction
} from '../types';
import { fetchPreparedFood, intakePreparedFood } from '../services/api';
import {
  ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, X,
  Clock, Thermometer, User, Utensils, Sparkles, Check, ChevronRight,
  TrendingDown, ShoppingBag, HeartHandshake, Trash2, ArrowRight
} from 'lucide-react';

interface RescuePreparedFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  kitchenId: string;
  kitchenName: string;
  onBatchCreated?: () => void;
  onNavigateToOffers?: () => void;
}

export const RescuePreparedFoodModal: React.FC<RescuePreparedFoodModalProps> = ({
  isOpen,
  onClose,
  kitchenId,
  kitchenName,
  onBatchCreated,
  onNavigateToOffers
}) => {
  const [batches, setBatches] = useState<PreparedFoodBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'intake' | 'ledger'>('intake');

  // Progressive Form State
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [dishName, setDishName] = useState('Wild Mushroom Risotto');
  const [servicePeriod, setServicePeriod] = useState('lunch');
  const [preparationTime, setPreparationTime] = useState('12:30');
  const [portions, setPortions] = useState(12);
  const [holdingTempC, setHoldingTempC] = useState(65.0);
  const [customerContact, setCustomerContact] = useState(false);
  const [buffetExposed, setBuffetExposed] = useState(false);
  const [buffetExposureHours, setBuffetExposureHours] = useState(0.0);
  const [staffControlled, setStaffControlled] = useState(true);
  const [safeUseCutoff, setSafeUseCutoff] = useState('21:00');
  const [allergens, setAllergens] = useState<string[]>(['Dairy']);
  const [authorizedStaff, setAuthorizedStaff] = useState('Head Chef Marco');
  const [handlingNotes, setHandlingNotes] = useState('Stored in hot holding drawer at 65°C');

  // Evaluation outcome
  const [latestBatch, setLatestBatch] = useState<PreparedFoodBatch | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBatches();
    }
  }, [isOpen, kitchenId]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await fetchPreparedFood(kitchenId);
      setBatches(data);
    } catch (err) {
      console.error('Failed to load prepared food batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: PreparedFoodIntakeRequest = {
        dish_name: dishName,
        service_period: servicePeriod,
        preparation_time: preparationTime,
        portions: portions,
        customer_contact: customerContact,
        buffet_exposed: buffetExposed,
        buffet_exposure_hours: buffetExposed ? buffetExposureHours : 0.0,
        staff_controlled: staffControlled,
        holding_temp_c: holdingTempC,
        safe_use_cutoff: safeUseCutoff,
        allergen_profile: allergens,
        authorized_staff: authorizedStaff,
        handling_notes: handlingNotes
      };

      const result = await intakePreparedFood(kitchenId, payload);
      setLatestBatch(result);
      await loadBatches();
      if (onBatchCreated) onBatchCreated();
    } catch (err: any) {
      alert(`Safety check failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAllergenToggle = (tag: string) => {
    setAllergens((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-cocoa/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-vanilla rounded-3xl border border-subtle shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-espresso text-vanilla px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sage/20 border border-sage/40 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-sage" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">Food Left Over</h3>
              <p className="text-xs text-vanilla/70">
                Post-service surplus food rescue & safety evaluation for {kitchenName}
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

        {/* View Switcher: Intake vs Past Ledger */}
        <div className="bg-oat px-6 pt-3 border-b border-subtle flex gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('intake')}
            className={`pb-2.5 border-b-2 transition ${
              activeTab === 'intake'
                ? 'border-terracotta text-espresso'
                : 'border-transparent text-espresso/60 hover:text-espresso'
            }`}
          >
            Record Leftover Food
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`pb-2.5 border-b-2 transition ${
              activeTab === 'ledger'
                ? 'border-terracotta text-espresso'
                : 'border-transparent text-espresso/60 hover:text-espresso'
            }`}
          >
            Past Surplus Records ({batches.length})
          </button>
        </div>

        {/* Main Body */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto font-sans text-espresso">
          {activeTab === 'intake' ? (
            <div className="space-y-6">
              {/* Question 1: What food is left after your service? (Directive 6) */}
              <div>
                <h4 className="font-serif text-xl font-bold text-espresso">
                  What food is left after your service?
                </h4>
                <p className="text-xs text-espresso/70 mt-1">
                  Guided progressive safety intake. Every dish is deterministically checked against safe temperatures and chain of custody.
                </p>
              </div>

              <form onSubmit={handleSubmitIntake} className="space-y-4">
                {/* Step 1: Dish details & portions */}
                <div className="p-5 bg-white rounded-2xl border border-subtle shadow-xs space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-espresso/70 block">
                    1. Dish & Quantity
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-espresso/80 block mb-1">
                        Dish Name
                      </label>
                      <input
                        type="text"
                        value={dishName}
                        onChange={(e) => setDishName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-subtle bg-vanilla text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-espresso/80 block mb-1">
                        Service Period
                      </label>
                      <select
                        value={servicePeriod}
                        onChange={(e) => setServicePeriod(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-subtle bg-vanilla text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
                      >
                        <option value="lunch">Lunch Service</option>
                        <option value="dinner">Dinner Service</option>
                        <option value="breakfast">Breakfast</option>
                        <option value="catering">Catering Event</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-espresso/80 block mb-1">
                        Portions Left
                      </label>
                      <div className="flex items-center border border-subtle rounded-xl bg-vanilla overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setPortions(Math.max(1, portions - 1))}
                          className="px-2.5 py-1.5 text-xs font-bold hover:bg-oat"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={portions}
                          onChange={(e) => setPortions(parseInt(e.target.value) || 1)}
                          className="w-full text-center text-xs font-bold font-serif bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setPortions(portions + 1)}
                          className="px-2.5 py-1.5 text-xs font-bold hover:bg-oat"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-espresso/80 block mb-1">
                        Time Prepared
                      </label>
                      <input
                        type="time"
                        value={preparationTime}
                        onChange={(e) => setPreparationTime(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-subtle bg-vanilla"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-espresso/80 block mb-1">
                        Holding Temp (°C)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={holdingTempC}
                        onChange={(e) => setHoldingTempC(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-subtle bg-vanilla font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 2: Progressive Safety & Handling Questions */}
                <div className="p-5 bg-white rounded-2xl border border-subtle shadow-xs space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-espresso/70 block">
                    2. Mandatory Safety & Handling History
                  </span>

                  <label className="flex items-start gap-3 p-3 rounded-xl bg-vanilla/60 border border-subtle cursor-pointer hover:bg-vanilla">
                    <input
                      type="checkbox"
                      checked={customerContact}
                      onChange={(e) => setCustomerContact(e.target.checked)}
                      className="mt-0.5 rounded text-terracotta focus:ring-terracotta"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-espresso block">
                        Was this food served to or returned by a customer?
                      </span>
                      <span className="text-[11px] text-espresso/70">
                        Zero tolerance: Food that has left staff custody or been served cannot be reused or donated.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl bg-vanilla/60 border border-subtle cursor-pointer hover:bg-vanilla">
                    <input
                      type="checkbox"
                      checked={buffetExposed}
                      onChange={(e) => setBuffetExposed(e.target.checked)}
                      className="mt-0.5 rounded text-terracotta focus:ring-terracotta"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-espresso block">
                        Was it exposed on a self-service buffet without sneeze guard?
                      </span>
                      <span className="text-[11px] text-espresso/70">
                        Buffet food exposed over 2 hours cannot be resold or donated.
                      </span>
                    </div>
                  </label>

                  {buffetExposed && (
                    <div className="pl-6 flex items-center gap-2">
                      <span className="text-xs text-espresso/80">Hours exposed:</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={buffetExposureHours}
                        onChange={(e) => setBuffetExposureHours(parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-xs rounded-lg border border-subtle bg-white font-bold"
                      />
                      <span className="text-xs text-espresso/60">hours (&gt; 2h will be rejected)</span>
                    </div>
                  )}

                  <label className="flex items-start gap-3 p-3 rounded-xl bg-vanilla/60 border border-subtle cursor-pointer hover:bg-vanilla">
                    <input
                      type="checkbox"
                      checked={staffControlled}
                      onChange={(e) => setStaffControlled(e.target.checked)}
                      className="mt-0.5 rounded text-sage focus:ring-sage"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-espresso block">
                        Continuously protected under authorized staff custody
                      </span>
                      <span className="text-[11px] text-espresso/70">
                        Held in commercial kitchen hot/cold holding unit under team supervision.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Step 3: Allergens & Authorization */}
                <div className="p-5 bg-white rounded-2xl border border-subtle shadow-xs space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-espresso/70 block">
                    3. Allergen Profile & Staff Confirmation
                  </span>

                  <div>
                    <label className="text-xs font-medium text-espresso/80 block mb-1.5">
                      Allergens Present
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Dairy', 'Gluten', 'Eggs', 'Tree Nuts', 'Soy', 'Shellfish', 'Vegetarian'].map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => handleAllergenToggle(tag)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                            allergens.includes(tag)
                              ? 'bg-terracotta text-white border-terracotta'
                              : 'bg-vanilla text-espresso/70 border-subtle hover:bg-oat'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-xs font-medium text-espresso/80 block mb-1">
                        Authorized Staff Member
                      </label>
                      <input
                        type="text"
                        value={authorizedStaff}
                        onChange={(e) => setAuthorizedStaff(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-subtle bg-vanilla"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-espresso/80 block mb-1">
                        Safe-Use Cutoff Time
                      </label>
                      <input
                        type="time"
                        value={safeUseCutoff}
                        onChange={(e) => setSafeUseCutoff(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-subtle bg-vanilla"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-terracotta hover:bg-terracotta-dark text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Verifying Safe Standards...' : 'Check Food Safety Eligibility'}</span>
                </button>
              </form>

              {/* Evaluation Result Display */}
              {latestBatch && (
                <div className="p-5 bg-white rounded-2xl border border-subtle shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-espresso/60 block">
                        Safety Gate Decision
                      </span>
                      <h4 className="font-serif text-base font-bold text-espresso">
                        {latestBatch.dish_name} ({latestBatch.portions_remaining} portions)
                      </h4>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-xl uppercase tracking-wider ${
                        latestBatch.safety_decision === 'PASS_ELIGIBLE'
                          ? 'bg-sage/15 text-sage border border-sage/30'
                          : latestBatch.safety_decision === 'NEEDS_STAFF_REVIEW'
                          ? 'bg-saffron/20 text-espresso border border-saffron/40'
                          : 'bg-terracotta/15 text-terracotta border border-terracotta/30'
                      }`}
                    >
                      {latestBatch.safety_decision === 'PASS_ELIGIBLE'
                        ? 'Eligible for Food Rescue'
                        : latestBatch.safety_decision === 'NEEDS_STAFF_REVIEW'
                        ? 'Needs Staff Review'
                        : 'Not Eligible (Disposal Required)'}
                    </span>
                  </div>

                  {/* If Eligible: Show permissible options (Directive 6) */}
                  {latestBatch.safety_decision === 'PASS_ELIGIBLE' ? (
                    <div className="space-y-2.5 p-4 bg-vanilla rounded-xl border border-subtle">
                      <span className="text-xs font-bold text-espresso block">
                        Permissible Next Actions (Approved until {latestBatch.safe_use_cutoff}):
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-3 bg-white rounded-xl border border-subtle flex flex-col justify-between">
                          <div className="flex items-center gap-1.5 text-espresso font-semibold">
                            <Clock className="w-3.5 h-3.5 text-sage" />
                            <span>1. Ordinary Sale</span>
                          </div>
                          <span className="text-[11px] text-espresso/60 mt-1">
                            Continue standard dinner sales within safe window.
                          </span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-subtle flex flex-col justify-between">
                          <div className="flex items-center gap-1.5 text-terracotta font-semibold">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>2. Meal Bundle</span>
                          </div>
                          <span className="text-[11px] text-espresso/60 mt-1">
                            Combine into discounted evening rescue offer.
                          </span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-subtle flex flex-col justify-between">
                          <div className="flex items-center gap-1.5 text-espresso font-semibold">
                            <HeartHandshake className="w-3.5 h-3.5 text-saffron" />
                            <span>3. Recovery Donation</span>
                          </div>
                          <span className="text-[11px] text-espresso/60 mt-1">
                            Label and dispatch to verified recovery org.
                          </span>
                        </div>
                      </div>

                      {onNavigateToOffers && (
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onNavigateToOffers();
                            }}
                            className="px-4 py-2 bg-terracotta hover:bg-terracotta-dark text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
                          >
                            <span>Create Discounted Meal Offer with this dish</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* If Ineligible: Clearly display why resale or donation cannot proceed */
                    <div className="p-4 bg-terracotta/10 border border-terracotta/30 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center gap-2 font-bold text-terracotta">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Why resale or donation cannot proceed:</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-1 text-espresso">
                        {latestBatch.rule_checks
                          .filter((c) => !c.passed)
                          .map((c, i) => (
                            <li key={i}>
                              <strong>{c.rule_name}:</strong> {c.reason}
                            </li>
                          ))}
                      </ul>
                      <div className="pt-2 text-[11px] text-espresso/70">
                        <strong>Required Action:</strong> Authorized staff must record this portion weight in the waste log. Do not redistribute.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* History Ledger Tab */
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-espresso block">
                Recorded Food Surplus Batches
              </span>

              {batches.length === 0 ? (
                <div className="p-8 text-center text-xs text-espresso/60 bg-white rounded-2xl border border-subtle">
                  No surplus food logged yet today.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {batches.map((batch) => (
                    <div
                      key={batch.id}
                      className="p-4 bg-white rounded-2xl border border-subtle shadow-xs flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-espresso">
                            {batch.dish_name}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                              batch.safety_decision === 'PASS_ELIGIBLE'
                                ? 'bg-sage/15 text-sage'
                                : 'bg-terracotta/15 text-terracotta'
                            }`}
                          >
                            {batch.safety_decision.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[11px] text-espresso/60 block mt-0.5">
                          {batch.portions_remaining} / {batch.portions_initially_available} portions remaining • Holding temp: {batch.holding_temp_c}°C
                        </span>
                      </div>

                      <div className="text-right text-[11px] text-espresso/70">
                        <span className="block font-medium">Safe until: {batch.safe_use_cutoff}</span>
                        <span className="text-[10px] text-espresso/50 capitalize">{batch.service_period} service</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-oat px-6 py-3.5 border-t border-subtle flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-espresso hover:bg-cocoa text-vanilla text-xs font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default RescuePreparedFoodModal;
