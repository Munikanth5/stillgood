import React, { useState, useEffect } from 'react';
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
  DollarSign,
  Utensils,
  CalendarCheck,
  Footprints,
  Info
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
  const isRestaurant = kitchen.id === 'kitchen_restaurant_verde' || kitchen.type === 'restaurant_cafe';

  const defaultMeals = isRestaurant ? 70 : (initialScenario.revised_expected_meals || 350);
  const baselineMeals = isRestaurant ? 120 : 500;
  const maxMeals = isRestaurant ? 220 : 650;
  const minMeals = isRestaurant ? 30 : 150;

  const [expectedMeals, setExpectedMeals] = useState<number>(defaultMeals);
  const [bufferPct, setBufferPct] = useState<number>(initialScenario.service_buffer_percentage || 5);
  const [minVegMeals, setMinVegMeals] = useState<number>(
    initialScenario.dietary_constraints[0]?.min_meals || (isRestaurant ? 35 : 120)
  );
  const [supplierDelayed, setSupplierDelayed] = useState<boolean>(true);
  const [prioritizePerishables, setPrioritizePerishables] = useState<boolean>(true);

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResults, setSimResults] = useState<{
    plan_a: PlanEvaluation;
    plan_b: PlanEvaluation;
    plan_c: PlanEvaluation;
  } | null>(null);

  useEffect(() => {
    setExpectedMeals(isRestaurant ? 70 : (initialScenario.revised_expected_meals || 350));
    setMinVegMeals(isRestaurant ? 35 : (initialScenario.dietary_constraints[0]?.min_meals || 120));
  }, [kitchen.id, isRestaurant]);

  // 1-Click Preset Handlers
  const applyPreset = async (presetType: string) => {
    let meals = expectedMeals;
    let delayed = supplierDelayed;
    let minVeg = minVegMeals;
    let perishables = prioritizePerishables;

    if (isRestaurant) {
      if (presetType === 'fewer_guests') {
        meals = 70; // 40 cancellations
      } else if (presetType === 'more_guests') {
        meals = 120; // Full night + walk-in rush
      } else if (presetType === 'supplier_delayed') {
        delayed = true;
      } else if (presetType === 'at_risk_stock') {
        perishables = true;
        minVeg = 45;
      } else if (presetType === 'reset_normal') {
        meals = 120;
        delayed = false;
        minVeg = 40;
      }
    } else {
      if (presetType === 'fewer_guests') {
        meals = 320;
      } else if (presetType === 'more_guests') {
        meals = 550;
      } else if (presetType === 'supplier_delayed') {
        delayed = true;
      } else if (presetType === 'at_risk_stock') {
        perishables = true;
        minVeg = 150;
      } else if (presetType === 'reset_normal') {
        meals = 500;
        delayed = false;
        minVeg = 150;
      }
    }

    setExpectedMeals(meals);
    setSupplierDelayed(delayed);
    setMinVegMeals(minVeg);
    setPrioritizePerishables(perishables);

    await triggerSimulation(meals, bufferPct, minVeg, delayed, perishables);
  };

  const triggerSimulation = async (
    meals: number = expectedMeals,
    buffer: number = bufferPct,
    minVeg: number = minVegMeals,
    delayed: boolean = supplierDelayed,
    perishables: boolean = prioritizePerishables
  ) => {
    setIsSimulating(true);
    try {
      const delayedIngredient = isRestaurant ? 'cream' : 'paneer';
      const supplierName = isRestaurant ? 'Country Fresh Dairy' : 'Fresh Dairy Farms Co.';
      const priorityItem = isRestaurant ? 'strawberries' : 'spinach';

      const updatedScenario: ParsedScenario = {
        ...initialScenario,
        kitchen_id: kitchen.id,
        original_expected_meals: baselineMeals,
        revised_expected_meals: meals,
        service_buffer_percentage: buffer,
        dietary_constraints: [{ tag: 'vegetarian', min_meals: minVeg }],
        supplier_disruptions: delayed
          ? [{
              supplier_name: supplierName,
              ingredient: delayedIngredient,
              status: 'delayed_after_lunch'
            }]
          : [],
        excluded_ingredients: delayed ? [delayedIngredient] : [],
        inventory_priorities: perishables ? [priorityItem] : [],
        raw_explanation: `What-If Simulation for ${kitchen.name}: Target ${meals} diners, safety buffer ${buffer}%, ${minVeg} veg portions, delayed ${delayedIngredient}: ${delayed}, prioritize ${priorityItem}: ${perishables}.`
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
      {/* 4-Step Progress Banner */}
      <div className="bg-ivory-cream rounded-2xl p-4 border border-ink-border/70 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-forest-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-forest-600" />
            Decision Twin Flow
          </span>
          <span className="text-[10px] text-ink-muted">Stress-Test Live Scenarios</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-ink-border text-ink-muted flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-forest-800/20 text-forest-900 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
            <div>
              <span className="font-semibold block">Check Today</span>
              <span className="text-[10px]">Living kitchen review</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-ink-border text-ink-muted flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-forest-800/20 text-forest-900 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
            <div>
              <span className="font-semibold block">Tell Us What Changed</span>
              <span className="text-[10px]">Logged disruption facts</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-forest-50 border-2 border-forest-600 text-forest-900 flex items-center gap-2 shadow-sm">
            <span className="w-5 h-5 rounded-full bg-forest-800 text-ivory flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
            <div>
              <span className="font-bold block">What-If Simulation</span>
              <span className="text-[10px] text-forest-700">Slide & test options</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-ink-border text-ink-muted flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-ink-border text-ink flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
            <div>
              <span className="font-semibold block">Authorize Cooks</span>
              <span className="text-[10px]">Lock approved prep</span>
            </div>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div className="bg-ivory rounded-2xl p-6 border border-ink-border/60 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-forest-700">
            <Sliders className="w-5 h-5 text-forest-600" />
            <h2 className="font-serif text-2xl font-bold text-ink">What-If Kitchen Simulator</h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-forest-50 text-forest-800 border border-forest-600/30 font-medium">
            {isRestaurant ? '🍴 Table Reservations + Walk-in Modeler' : '🏢 Headcount & Batch Modeler'}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-3xl">
          Move sliders to simulate what happens if reservations cancel, unexpected walk-ins arrive, or supplier vans run late.
          Every move instantly re-checks inventory, supplier deadlines, and food waste without guessing.
        </p>
      </div>

      {/* Preset Action Bar */}
      <div className="bg-ivory-cream rounded-2xl p-4 border border-ink-border/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
            1-Click Preset Simulations ({isRestaurant ? 'Restaurant' : 'Cafeteria'})
          </span>
          <span className="text-[10px] text-forest-700 font-medium">Instant recalculation</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPreset('fewer_guests')}
            className="px-3.5 py-1.5 rounded-lg border border-ink-border bg-white hover:bg-forest-50 text-xs font-medium text-ink transition shadow-sm"
          >
            📉 {isRestaurant ? 'Rainstorm / 40 Cancellations (70 Diners)' : 'Fewer Guests (320)'}
          </button>
          <button
            onClick={() => applyPreset('more_guests')}
            className="px-3.5 py-1.5 rounded-lg border border-ink-border bg-white hover:bg-forest-50 text-xs font-medium text-ink transition shadow-sm"
          >
            📈 {isRestaurant ? 'Friday Night Walk-in Rush (120 Covers)' : 'More Guests (550)'}
          </button>
          <button
            onClick={() => applyPreset('supplier_delayed')}
            className="px-3.5 py-1.5 rounded-lg border border-terracotta/40 bg-terracotta-bg hover:bg-terracotta-bg/80 text-xs font-medium text-terracotta-dark transition shadow-sm"
          >
            🚚 {isRestaurant ? 'Dairy Van Delayed (Heavy Cream)' : 'Supplier Delayed (Paneer)'}
          </button>
          <button
            onClick={() => applyPreset('at_risk_stock')}
            className="px-3.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-medium text-amber-900 transition shadow-sm"
          >
            🍓 {isRestaurant ? 'Rescue 8 kg Expiring Strawberries' : '🥬 Prioritize Expiring Spinach'}
          </button>
          <button
            onClick={() => applyPreset('reset_normal')}
            className="px-3.5 py-1.5 rounded-lg border border-forest-600/30 bg-forest-50 hover:bg-forest-100 text-xs font-medium text-forest-800 transition shadow-sm ml-auto"
          >
            🔄 Reset Normal ({baselineMeals})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Interactive Sliders & Toggles */}
        <div className="bg-ivory rounded-2xl border border-ink-border/60 p-6 shadow-sm space-y-6">
          <h3 className="font-serif text-lg font-bold text-ink">
            Kitchen Dial Controls
          </h3>

          {/* Input 1: Expected Meals / Covers (No slider) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-espresso block">
                  {isRestaurant ? 'Expected Dinner Covers' : 'Expected Meal Headcount'}
                </span>
                <span className="text-[10px] text-espresso/60">
                  {isRestaurant ? 'Table bookings plus bar walk-ins' : 'Registered badge attendance'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setExpectedMeals(Math.max(minMeals, expectedMeals - (isRestaurant ? 5 : 10)))}
                  className="w-7 h-7 rounded-lg border border-subtle bg-white text-espresso hover:bg-oat text-xs font-bold transition flex items-center justify-center"
                >
                  -
                </button>
                <input
                  type="number"
                  min={minMeals}
                  max={maxMeals}
                  step={isRestaurant ? 5 : 10}
                  value={expectedMeals}
                  onChange={(e) => setExpectedMeals(Math.max(minMeals, Math.min(maxMeals, parseInt(e.target.value) || minMeals)))}
                  className="w-20 px-2 py-1 text-center font-serif font-bold text-espresso text-sm border border-subtle rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={() => setExpectedMeals(Math.min(maxMeals, expectedMeals + (isRestaurant ? 5 : 10)))}
                  className="w-7 h-7 rounded-lg border border-subtle bg-white text-espresso hover:bg-oat text-xs font-bold transition flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-espresso/60">
              <span>Min: {minMeals}</span>
              <span>Baseline: {baselineMeals}</span>
              <span>Max: {maxMeals}</span>
            </div>
          </div>

          {/* Input 2: Safety Buffer % (No slider) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-espresso block">Safety Buffer Policy</span>
                <span className="text-[10px] text-espresso/60">Held in raw cold reserve in cooler</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBufferPct(Math.max(0, bufferPct - 1))}
                  className="w-7 h-7 rounded-lg border border-subtle bg-white text-espresso hover:bg-oat text-xs font-bold transition flex items-center justify-center"
                >
                  -
                </button>
                <div className="flex items-center">
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={bufferPct}
                    onChange={(e) => setBufferPct(Math.max(0, Math.min(15, parseInt(e.target.value) || 0)))}
                    className="w-14 px-2 py-1 text-center font-serif font-bold text-espresso text-sm border border-subtle rounded-lg bg-white"
                  />
                  <span className="ml-1 text-xs text-espresso/70">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBufferPct(Math.min(15, bufferPct + 1))}
                  className="w-7 h-7 rounded-lg border border-subtle bg-white text-espresso hover:bg-oat text-xs font-bold transition flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Input 3: Minimum Vegetarian Requirement (No slider) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-espresso block">Minimum Vegetarian Diners</span>
                <span className="text-[10px] text-espresso/60">Guaranteed dietary portions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMinVegMeals(Math.max(isRestaurant ? 10 : 50, minVegMeals - (isRestaurant ? 5 : 10)))}
                  className="w-7 h-7 rounded-lg border border-subtle bg-white text-espresso hover:bg-oat text-xs font-bold transition flex items-center justify-center"
                >
                  -
                </button>
                <input
                  type="number"
                  min={isRestaurant ? 10 : 50}
                  max={isRestaurant ? 100 : 300}
                  step={isRestaurant ? 5 : 10}
                  value={minVegMeals}
                  onChange={(e) => setMinVegMeals(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 px-2 py-1 text-center font-serif font-bold text-espresso text-sm border border-subtle rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={() => setMinVegMeals(Math.min(isRestaurant ? 100 : 300, minVegMeals + (isRestaurant ? 5 : 10)))}
                  className="w-7 h-7 rounded-lg border border-subtle bg-white text-espresso hover:bg-oat text-xs font-bold transition flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Toggle 1: Supplier Delayed */}
          <div className="p-3.5 rounded-xl border border-ink-border/60 bg-ivory-cream flex items-center justify-between">
            <div className="text-xs">
              <span className="font-semibold text-ink block">
                {isRestaurant ? 'Dairy Van Delayed (Heavy Cream)' : 'Paneer Supplier Delayed'}
              </span>
              <span className="text-[11px] text-ink-muted">
                {isRestaurant ? 'Truck late; cannot make Creamy Alfredo' : 'Arrives after lunch rush cutoff'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={supplierDelayed}
              onChange={(e) => setSupplierDelayed(e.target.checked)}
              className="w-4 h-4 accent-terracotta cursor-pointer"
            />
          </div>

          {/* Toggle 2: Prioritize Perishables */}
          <div className="p-3.5 rounded-xl border border-ink-border/60 bg-ivory-cream flex items-center justify-between">
            <div className="text-xs">
              <span className="font-semibold text-ink block">
                {isRestaurant ? 'Rescue Fresh Strawberries First' : 'Rescue Expiring Spinach First'}
              </span>
              <span className="text-[11px] text-ink-muted">
                {isRestaurant ? 'Feature 8 kg fruit in dessert special' : 'Incorporate 24 kg into Palak Dal'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={prioritizePerishables}
              onChange={(e) => setPrioritizePerishables(e.target.checked)}
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
                  Deterministic evaluation for {expectedMeals} target diners ({kitchen.name})
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
                    <span className="text-xs font-bold text-ink">Choice A (Inertia)</span>
                    <StatusBadge status={simResults.plan_a.feasibility_status} size="sm" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-ink-muted">
                      <span>Meals Prepped:</span>
                      <span className="font-mono">{simResults.plan_a.total_portions}</span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Unserved Food Waste:</span>
                      <span className="font-mono text-terracotta font-semibold">{simResults.plan_a.expected_surplus_meals} meals</span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Purchasing Cost:</span>
                      <span className="font-mono">${simResults.plan_a.total_purchase_cost.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-terracotta-dark bg-terracotta-bg p-2 rounded">
                    ⚠️ Cooked for normal night anyway. High food waste.
                  </div>
                </div>

                {/* Plan B Quick Card */}
                <div className="p-4 rounded-xl border border-ink-border bg-ivory-cream space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">Choice B (Blind Cut)</span>
                    <StatusBadge status={simResults.plan_b.feasibility_status} size="sm" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-ink-muted">
                      <span>Meals Prepped:</span>
                      <span className="font-mono">{simResults.plan_b.total_portions}</span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Unserved Waste:</span>
                      <span className="font-mono">0</span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Perishables Rescued:</span>
                      <span className="font-mono">{simResults.plan_b.at_risk_inventory_utilized_kg} kg</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-900 bg-amber-50 p-2 rounded">
                    ⚠️ Blindly cut prep. Perishable stock remains unrescued in cooler.
                  </div>
                </div>

                {/* Plan C Quick Card (Winner!) */}
                <div className="p-4 rounded-xl border-2 border-forest-600 bg-forest-50/70 space-y-3 relative shadow-sm">
                  <span className="absolute -top-2.5 right-3 bg-forest-800 text-ivory text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-forest-900">Choice C (Smart Rescue)</span>
                    <StatusBadge status="FEASIBLE" size="sm" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-forest-900">
                      <span>Meals Prepped:</span>
                      <span className="font-mono font-bold">{simResults.plan_c.total_portions}</span>
                    </div>
                    <div className="flex justify-between text-forest-900">
                      <span>Rescued Stock:</span>
                      <span className="font-mono font-bold text-forest-700">{simResults.plan_c.at_risk_inventory_utilized_kg} kg</span>
                    </div>
                    <div className="flex justify-between text-forest-900">
                      <span>Purchasing Cost:</span>
                      <span className="font-mono font-bold">${simResults.plan_c.total_purchase_cost.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-forest-800 bg-forest-100/60 p-2 rounded font-medium">
                    ✨ Fixed-menu smart pairing. Rescues expiring stock with zero unserved waste!
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-ink-muted">
                Adjust any dial on the left or click a preset above to see the 3-way simulation response.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
