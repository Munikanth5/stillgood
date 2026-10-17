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
  Clock, Thermometer, User, Utensils, Sparkles, Check, ChevronRight
} from 'lucide-react';

interface RescuePreparedFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  kitchenId: string;
  kitchenName: string;
  onBatchCreated?: () => void;
}

export const RescuePreparedFoodModal: React.FC<RescuePreparedFoodModalProps> = ({
  isOpen,
  onClose,
  kitchenId,
  kitchenName,
  onBatchCreated
}) => {
  const [batches, setBatches] = useState<PreparedFoodBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'intake' | 'history'>('intake');

  // Intake form state
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
  const [handlingNotes, setHandlingNotes] = useState('Kept in Alto-Shaam hot holding drawer at 65°C');

  // Result of latest evaluation
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
      alert(`Intake failed: ${err.message}`);
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
      <div className="relative w-full max-w-4xl bg-vanilla rounded-2xl border border-subtle shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-espresso text-vanilla px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sage/20 border border-sage/40 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-sage" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-white">Rescue Prepared Food</h3>
                <span className="text-[10px] bg-sage text-white px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                  FSSAI / HACCP Deterministic Safety Gate
                </span>
              </div>
              <p className="text-xs text-vanilla/70">
                Post-service surplus intake with zero-hallucination safety certification for {kitchenName}
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

        {/* Tab Buttons */}
        <div className="bg-oat px-6 pt-3 border-b border-subtle flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('intake')}
            className={`pb-2 border-b-2 transition ${
              activeTab === 'intake'
                ? 'border-terracotta text-espresso'
                : 'border-transparent text-espresso/60 hover:text-espresso'
            }`}
          >
            Surplus Intake & Safety Gate
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 border-b-2 transition ${
              activeTab === 'history'
                ? 'border-terracotta text-espresso'
                : 'border-transparent text-espresso/60 hover:text-espresso'
            }`}
          >
            Surplus Inventory Ledger ({batches.length} batches)
          </button>
        </div>

        {/* Main Body */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto font-sans text-espresso">
          {activeTab === 'intake' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Intake Form */}
              <div className="lg:col-span-7 space-y-4">
                <form onSubmit={handleSubmitIntake} className="space-y-4">
                  <div className="p-4 bg-white rounded-xl border border-subtle space-y-3.5 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-espresso block">
                      1. Dish & Preparation Info
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-espresso/80 block mb-1">
                          Dish Name
                        </label>
                        <input
                          type="text"
                          value={dishName}
                          onChange={(e) => setDishName(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-subtle bg-vanilla text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-espresso/80 block mb-1">
                          Service Period
                        </label>
                        <select
                          value={servicePeriod}
                          onChange={(e) => setServicePeriod(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-subtle bg-vanilla text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
                        >
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="breakfast">Breakfast</option>
                          <option value="catering">Catering Event</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-espresso/80 block mb-1">
                          Portions Left
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={portions}
                          onChange={(e) => setPortions(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-subtle bg-vanilla text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-espresso/80 block mb-1">
                          Time Prepared
                        </label>
                        <input
                          type="time"
                          value={preparationTime}
                          onChange={(e) => setPreparationTime(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-subtle bg-vanilla text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-espresso/80 block mb-1">
                          Holding Temp (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={holdingTempC}
                          onChange={(e) => setHoldingTempC(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-subtle bg-vanilla text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Food Safety & Chain of Custody Checks */}
                  <div className="p-4 bg-white rounded-xl border border-subtle space-y-3 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-espresso block">
                      2. Food Safety & Chain-of-Custody Declaration
                    </span>

                    <label className="flex items-start gap-2.5 p-2 rounded-lg bg-vanilla/60 border border-subtle cursor-pointer hover:bg-vanilla">
                      <input
                        type="checkbox"
                        checked={customerContact}
                        onChange={(e) => setCustomerContact(e.target.checked)}
                        className="mt-0.5 rounded text-terracotta focus:ring-terracotta"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-espresso block">
                          Customer Contact / Returned Food
                        </span>
                        <span className="text-[11px] text-espresso/70">
                          Check if dish was served to a guest table or returned (Strict FSSAI zero-tolerance rule: triggers immediate disposal)
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 rounded-lg bg-vanilla/60 border border-subtle cursor-pointer hover:bg-vanilla">
                      <input
                        type="checkbox"
                        checked={buffetExposed}
                        onChange={(e) => setBuffetExposed(e.target.checked)}
                        className="mt-0.5 rounded text-terracotta focus:ring-terracotta"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-espresso block">
                          Exposed on Self-Service Buffet
                        </span>
                        <span className="text-[11px] text-espresso/70">
                          Was it left exposed to self-service diners without sneeze guard protection?
                        </span>
                      </div>
                    </label>

                    {buffetExposed && (
                      <div className="pl-6 flex items-center gap-2">
                        <span className="text-[11px] text-espresso/80">Exposure Duration:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={buffetExposureHours}
                          onChange={(e) => setBuffetExposureHours(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-xs rounded border border-subtle bg-vanilla"
                        />
                        <span className="text-[11px] text-espresso/60">hours (&gt; 2h will reject)</span>
                      </div>
                    )}

                    <label className="flex items-start gap-2.5 p-2 rounded-lg bg-vanilla/60 border border-subtle cursor-pointer hover:bg-vanilla">
                      <input
                        type="checkbox"
                        checked={staffControlled}
                        onChange={(e) => setStaffControlled(e.target.checked)}
                        className="mt-0.5 rounded text-sage focus:ring-sage"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-espresso block">
                          Continuously Kitchen Staff Controlled
                        </span>
                        <span className="text-[11px] text-espresso/70">
                          Protected and controlled under authorized culinary team supervision
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Allergen & Staff Sign-off */}
                  <div className="p-4 bg-white rounded-xl border border-subtle space-y-3 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-espresso block">
                      3. Allergens & Staff Sign-Off
                    </span>

                    <div>
                      <label className="text-[11px] font-medium text-espresso/80 block mb-1.5">
                        Declared Allergens
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Dairy', 'Gluten', 'Eggs', 'Nuts', 'Soy', 'Shellfish', 'Vegetarian'].map((tag) => (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => handleAllergenToggle(tag)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition ${
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
                        <label className="text-[11px] font-medium text-espresso/80 block mb-1">
                          Authorized Staff Sign-Off
                        </label>
                        <input
                          type="text"
                          value={authorizedStaff}
                          onChange={(e) => setAuthorizedStaff(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-subtle bg-vanilla text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-espresso/80 block mb-1">
                          Safe-Use Cutoff Time
                        </label>
                        <input
                          type="time"
                          value={safeUseCutoff}
                          onChange={(e) => setSafeUseCutoff(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-subtle bg-vanilla text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-terracotta hover:bg-terracotta-dark text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{submitting ? 'Running Deterministic Safety Gate...' : 'Run Mandatory Safety Decision Gate'}</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Deterministic Gate Decision Receipt */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 bg-oat rounded-xl border border-subtle">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-terracotta" />
                    <span className="text-xs font-bold text-espresso uppercase tracking-wider">
                      Live Food Safety Evaluation
                    </span>
                  </div>
                  <p className="text-[11px] text-espresso/70">
                    Never delegated to an LLM. Pure deterministic FSSAI/HACCP gate verifying thermal holding, chain of custody, and allergen compliance.
                  </p>
                </div>

                {latestBatch ? (
                  <div className="p-4 bg-white rounded-xl border border-subtle shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-espresso">{latestBatch.dish_name}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider font-mono ${
                          latestBatch.safety_decision === 'PASS_ELIGIBLE'
                            ? 'bg-sage/15 text-sage border border-sage/30'
                            : latestBatch.safety_decision === 'NEEDS_STAFF_REVIEW'
                            ? 'bg-saffron/20 text-espresso border border-saffron/40'
                            : 'bg-terracotta/15 text-terracotta border border-terracotta/30'
                        }`}
                      >
                        {latestBatch.safety_decision.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Rule Checks Detail */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-espresso/60 tracking-wider block">
                        Verified Deterministic Rules
                      </span>
                      {latestBatch.rule_checks.map((check, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                            check.passed
                              ? 'bg-sage/5 border-sage/20 text-espresso'
                              : 'bg-terracotta/5 border-terracotta/20 text-espresso'
                          }`}
                        >
                          {check.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-sage shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-semibold text-[11px]">{check.rule_name}</div>
                            <div className="text-[10px] text-espresso/70">{check.reason}</div>
                            <div className="text-[9px] font-mono text-espresso/50 mt-0.5">
                              Observed: {check.evidence_observed}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recommended Action */}
                    <div className="p-3 bg-vanilla rounded-lg border border-subtle space-y-1">
                      <span className="text-[10px] uppercase font-bold text-espresso/60 tracking-wider block">
                        Recommended Rescue Action
                      </span>
                      <div className="font-semibold text-terracotta text-xs flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span>{latestBatch.recommended_action.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-[10px] text-espresso/70">
                        {latestBatch.safety_decision === 'PASS_ELIGIBLE'
                          ? `Eligible for discounted bundle offer or donation before safe-use cutoff (${latestBatch.safe_use_cutoff}).`
                          : 'Must NOT be served, bundled, or donated. Log for waste analysis.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 bg-white rounded-xl border border-dashed border-subtle text-center text-espresso/60 space-y-2">
                    <Utensils className="w-8 h-8 text-espresso/30 mx-auto" />
                    <p className="text-xs">
                      Submit prepared food surplus intake to run deterministic safety evaluation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* History Tab: Ledger of All Batches */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-espresso">
                  Recorded Prepared Food Batches
                </span>
                <span className="text-xs text-espresso/60">
                  {batches.length} total batches recorded
                </span>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-espresso/60">Loading surplus ledger...</div>
              ) : batches.length === 0 ? (
                <div className="p-8 text-center text-xs text-espresso/60 bg-white rounded-xl border border-subtle">
                  No surplus batches recorded yet.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-subtle overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-oat/50 text-[11px] text-espresso/70 font-semibold uppercase border-b border-subtle">
                      <tr>
                        <th className="px-4 py-2.5">Dish</th>
                        <th className="px-4 py-2.5">Service</th>
                        <th className="px-4 py-2.5">Portions Remaining</th>
                        <th className="px-4 py-2.5">Holding Temp</th>
                        <th className="px-4 py-2.5">Safety Status</th>
                        <th className="px-4 py-2.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle/60">
                      {batches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-vanilla/40 transition">
                          <td className="px-4 py-2.5">
                            <span className="font-semibold text-espresso block">{batch.dish_name}</span>
                            <span className="text-[10px] text-espresso/60">Cutoff: {batch.safe_use_cutoff}</span>
                          </td>
                          <td className="px-4 py-2.5 capitalize text-espresso/80">
                            {batch.service_period}
                          </td>
                          <td className="px-4 py-2.5 font-bold font-mono text-espresso">
                            {batch.portions_remaining} / {batch.portions_initially_available}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-espresso">
                            {batch.holding_temp_c}°C
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                batch.safety_decision === 'PASS_ELIGIBLE'
                                  ? 'bg-sage/15 text-sage'
                                  : batch.safety_decision === 'NEEDS_STAFF_REVIEW'
                                  ? 'bg-saffron/20 text-espresso'
                                  : 'bg-terracotta/15 text-terracotta'
                              }`}
                            >
                              {batch.safety_decision.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[11px] text-espresso/70">
                            {batch.recommended_action.replace(/_/g, ' ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-oat px-6 py-3.5 border-t border-subtle flex items-center justify-between">
          <div className="text-[11px] text-espresso/60 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sage" />
            <span>Zero customer-contact tolerance ensures absolute consumer food safety</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-espresso hover:bg-cocoa text-vanilla text-xs font-semibold rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
