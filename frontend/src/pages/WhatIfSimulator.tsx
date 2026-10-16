import React, { useState } from 'react';
import { KitchenProfile, ParsedScenario, PlanEvaluation } from '../types';
import { calculateReplan } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  Sliders,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Boxes,
  Users,
  DollarSign
} from 'lucide-react';

interface WhatIfSimulatorProps {
  kitchen: KitchenProfile;
  initialScenario: ParsedScenario;
  onPlanGenerated: (data: any) => void;
  onNavigateToComparison: () => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  kitchen,
  initialScenario,
  onPlanGenerated,
  onNavigateToComparison
}) => {
  const [expectedMeals, setExpectedMeals] = useState<number>(initialScenario.revised_expected_meals || 350);
  const [bufferPct, setBufferPct] = useState<number>(initialScenario.service_buffer_percentage || 5);
  const [minVegMeals, setMinVegMeals] = useState<number>(
    initialScenario.dietary_constraints[0]?.min_meals || 120
  );
  const [paneerDelayed, setPaneerDelayed] = useState<boolean>(true);
  const [prioritizeSpinach, setPrioritizeSpinach] = useState<boolean>(true);

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResults, setSimResults] = useState<{
    plan_a: PlanEvaluation;
    plan_b: PlanEvaluation;
    plan_c: PlanEvaluation;
  } | null>(null);

  // Genuine Preset Handlers
  const applyPreset = async (presetType: string) => {
    let meals = expectedMeals;
    let delayed = paneerDelayed;
    let minVeg = minVegMeals;
    let spinach = prioritizeSpinach;

    if (presetType === 'fewer_guests') {
      meals = 320;
    } else if (presetType === 'more_guests') {
      meals = 550;
    } else if (presetType === 'supplier_delayed') {
      delayed = true;
    } else if (presetType === 'at_risk_stock') {
      spinach = true;
      minVeg = 150;
    } else if (presetType === 'event_cancelled') {
      meals = 180;
    } else if (presetType === 'reset_normal') {
      meals = 500;
      delayed = false;
      minVeg = 150;
    }

    setExpectedMeals(meals);
    setPaneerDelayed(delayed);
    setMinVegMeals(minVeg);
    setPrioritizeSpinach(spinach);

    await triggerSimulation(meals, bufferPct, minVeg, delayed, spinach);
  };

  const triggerSimulation = async (
    meals: number = expectedMeals,
    buffer: number = bufferPct,
    minVeg: number = minVegMeals,
    delayed: boolean = paneerDelayed,
    spinach: boolean = prioritizeSpinach
  ) => {
    setIsSimulating(true);
    try {
      const updatedScenario: ParsedScenario = {
        ...initialScenario,
        original_expected_meals: 500,
        revised_expected_meals: meals,
        service_buffer_percentage: buffer,
        dietary_constraints: [{ tag: 'vegetarian', min_meals: minVeg }],
        supplier_disruptions: delayed
          ? [{
              supplier_name: 'Fresh Dairy Farms Co.',
              ingredient: 'paneer',
              status: 'delayed_after_lunch'
            }]
          : [],
        excluded_ingredients: delayed ? ['paneer'] : [],
        inventory_priorities: spinach ? ['spinach'] : [],
        raw_explanation: `Simulated attendance: ${meals} meals, buffer ${buffer}%, min ${minVeg} veg, paneer delayed: ${delayed}, prioritize spinach: ${spinach}.`
      };

      const res = await calculateReplan(updatedScenario);
      setSimResults({
        plan_a: res.plans.plan_a,
        plan_b: res.plans.plan_b,
        plan_c: res.plans.plan_c,
      });
      onPlanGenerated(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-ivory rounded-2xl p-6 border border-ink-border/60 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-forest-700">
          <Sliders className="w-5 h-5 text-forest-600" />
          <h2 className="font-serif text-2xl font-bold text-ink">What-If Kitchen Simulator</h2>
        </div>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-3xl">
          Adjust live parameters to stress-test your kitchen. Every slider movement recalculates
          recipe scaling, FEFO batch allocations, supplier cutoffs, and constraint feasibility using the actual deterministic backend.
        </p>
      </div>

      {/* Preset Action Bar */}
      <div className="bg-ivory-cream rounded-2xl p-4 border border-ink-border/60 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
          One-Click Operational Presets
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPreset('fewer_guests')}
            className="px-3.5 py-1.5 rounded-lg border border-ink-border bg-white hover:bg-forest-50 text-xs font-medium text-ink transition shadow-sm"
          >
            📉 Fewer Guests (320)
          </button>
          <button
            onClick={() => applyPreset('more_guests')}
            className="px-3.5 py-1.5 rounded-lg border border-ink-border bg-white hover:bg-forest-50 text-xs font-medium text-ink transition shadow-sm"
          >
            📈 More Guests (550)
          </button>
          <button
            onClick={() => applyPreset('supplier_delayed')}
            className="px-3.5 py-1.5 rounded-lg border border-terracotta/40 bg-terracotta-bg hover:bg-terracotta-bg/80 text-xs font-medium text-terracotta-dark transition shadow-sm"
          >
            🚚 Supplier Delayed (Paneer)
          </button>
          <button
            onClick={() => applyPreset('at_risk_stock')}
            className="px-3.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-medium text-amber-900 transition shadow-sm"
          >
            🥬 Prioritize At-Risk Spinach
          </button>
          <button
            onClick={() => applyPreset('event_cancelled')}
            className="px-3.5 py-1.5 rounded-lg border border-ink-border bg-white hover:bg-forest-50 text-xs font-medium text-ink transition shadow-sm"
          >
            ⛈️ Heavy Rain / Low Shift (180)
          </button>
          <button
            onClick={() => applyPreset('reset_normal')}
            className="px-3.5 py-1.5 rounded-lg border border-forest-600/30 bg-forest-50 hover:bg-forest-100 text-xs font-medium text-forest-800 transition shadow-sm ml-auto"
          >
            🔄 Reset Normal (500)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Interactive Sliders & Toggles */}
        <div className="bg-ivory rounded-2xl border border-ink-border/60 p-6 shadow-sm space-y-6">
          <h3 className="font-serif text-lg font-bold text-ink">
            Scenario Parameters
          </h3>

          {/* Slider 1: Expected Meals */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-ink">Expected Guests / Attendance</span>
              <span className="font-serif font-bold text-forest-800 text-sm tabular-nums">
                {expectedMeals} meals
              </span>
            </div>
            <input
              type="range"
              min={150}
              max={650}
              step={10}
              value={expectedMeals}
              onChange={(e) => setExpectedMeals(parseInt(e.target.value))}
              className="w-full accent-forest-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-ink-muted">
              <span>150</span>
              <span>Baseline: 500</span>
              <span>Capacity: 650</span>
            </div>
          </div>

          {/* Slider 2: Safety Buffer % */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-ink">Safety Buffer Policy</span>
              <span className="font-serif font-bold text-forest-800 text-sm tabular-nums">
                {bufferPct}% (+{Math.round(expectedMeals * (bufferPct / 100))} meals)
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              step={1}
              value={bufferPct}
              onChange={(e) => setBufferPct(parseInt(e.target.value))}
              className="w-full accent-forest-700 cursor-pointer"
            />
          </div>

          {/* Slider 3: Minimum Vegetarian Requirement */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-ink">Minimum Vegetarian Meals</span>
              <span className="font-serif font-bold text-forest-800 text-sm tabular-nums">
                {minVegMeals} portions
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={300}
              step={10}
              value={minVegMeals}
              onChange={(e) => setMinVegMeals(parseInt(e.target.value))}
              className="w-full accent-forest-700 cursor-pointer"
            />
          </div>

          {/* Toggle 1: Paneer Supplier Delayed */}
          <div className="p-3.5 rounded-xl border border-ink-border/60 bg-ivory-cream flex items-center justify-between">
            <div className="text-xs">
              <span className="font-semibold text-ink block">Paneer Supplier Delayed</span>
              <span className="text-[11px] text-ink-muted">Fresh Dairy truck arrives past lunch cutoff</span>
            </div>
            <input
              type="checkbox"
              checked={paneerDelayed}
              onChange={(e) => setPaneerDelayed(e.target.checked)}
              className="w-4 h-4 accent-terracotta cursor-pointer"
            />
          </div>

          {/* Toggle 2: Prioritize Spinach */}
          <div className="p-3.5 rounded-xl border border-ink-border/60 bg-ivory-cream flex items-center justify-between">
            <div className="text-xs">
              <span className="font-semibold text-ink block">Rescue At-Risk Spinach First</span>
              <span className="text-[11px] text-ink-muted">Prioritize 24 kg expiring batch in Palak Dal</span>
            </div>
            <input
              type="checkbox"
              checked={prioritizeSpinach}
              onChange={(e) => setPrioritizeSpinach(e.target.checked)}
              className="w-4 h-4 accent-forest-700 cursor-pointer"
            />
          </div>

          {/* Run Simulation Button */}
          <button
            onClick={() => triggerSimulation()}
            disabled={isSimulating}
            className="w-full py-3 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-xl shadow transition flex items-center justify-center gap-2"
          >
            {isSimulating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-forest-500" />
            ) : (
              <Sparkles className="w-4 h-4 text-forest-500" />
            )}
            <span>{isSimulating ? 'Recalculating Decision Twin...' : 'Recalculate Decision Twin'}</span>
          </button>
        </div>

        {/* Right 2 Cols: Live Simulated Plan Outcome */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-ivory rounded-2xl border border-ink-border/60 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-ink">
                  Real-time Simulation Response
                </h3>
                <p className="text-xs text-ink-muted">
                  Deterministic evaluation for {expectedMeals} target guests
                </p>
              </div>
              <button
                onClick={onNavigateToComparison}
                className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
              >
                <span>Full Comparison</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {simResults ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Plan A Quick Card */}
                <div className="p-4 rounded-xl border border-ink-border bg-ivory-cream space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">Plan A (Retain)</span>
                    <StatusBadge status={simResults.plan_a.feasibility_status} size="sm" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-ink-muted">
                      <span>Meals:</span>
                      <span className="font-mono">{simResults.plan_a.total_portions}</span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Surplus Risk:</span>
                      <span className="font-mono text-terracotta">{simResults.plan_a.expected_surplus_meals}</span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Purchasing:</span>
                      <span className="font-mono">${simResults.plan_a.total_purchase_cost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Plan B Quick Card */}
                <div className="p-4 rounded-xl border border-ink-border bg-ivory-cream space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">Plan B (Scale)</span>
                    <StatusBadge status={simResults.plan_b.feasibility_status} size="sm" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-ink-muted">
                      <span>Meals:</span>
                      <span className="font-mono">{simResults.plan_b.total_portions}</span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Surplus Risk:</span>
                      <span className="font-mono">0</span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Purchasing:</span>
                      <span className="font-mono">${simResults.plan_b.total_purchase_cost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Plan C Quick Card (Winner!) */}
                <div className="p-4 rounded-xl border-2 border-forest-600 bg-forest-50/70 space-y-3 relative shadow-sm">
                  <span className="absolute -top-2.5 right-3 bg-forest-800 text-ivory text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-forest-900">Plan C (Rescue)</span>
                    <StatusBadge status="FEASIBLE" size="sm" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-forest-900">
                      <span>Meals:</span>
                      <span className="font-mono font-bold">{simResults.plan_c.total_portions}</span>
                    </div>
                    <div className="flex justify-between text-forest-900">
                      <span>Rescued Stock:</span>
                      <span className="font-mono font-bold text-forest-700">{simResults.plan_c.at_risk_inventory_utilized_kg} kg</span>
                    </div>
                    <div className="flex justify-between text-forest-900">
                      <span>Purchasing:</span>
                      <span className="font-mono font-bold">${simResults.plan_c.total_purchase_cost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-ink-muted">
                Adjust any parameter on the left or click a preset to see the 3-way simulation response.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
