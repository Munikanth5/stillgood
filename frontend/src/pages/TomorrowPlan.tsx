import React from 'react';
import { PlanEvaluation, KitchenProfile } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  CalendarCheck2,
  CookingPot,
  Boxes,
  ShoppingCart,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Utensils,
  Snowflake,
  Flame,
  CalendarCheck,
  Footprints
} from 'lucide-react';

interface TomorrowPlanProps {
  kitchen: KitchenProfile;
  plan: PlanEvaluation | null;
  onOpenReceipt: () => void;
  onNavigateToSimulator: () => void;
}

export const TomorrowPlan: React.FC<TomorrowPlanProps> = ({
  kitchen,
  plan,
  onOpenReceipt,
  onNavigateToSimulator
}) => {
  if (!plan) {
    return (
      <div className="p-12 text-center bg-ivory rounded-2xl border border-ink-border text-ink-muted text-sm space-y-3">
        <CalendarCheck2 className="w-8 h-8 text-forest-700 mx-auto" />
        <p>No active tomorrow plan generated. Visit the AI Assistant or Simulator to compute a decision.</p>
      </div>
    );
  }

  const isRestaurant = kitchen.id === 'kitchen_restaurant_verde' || kitchen.type === 'restaurant_cafe';

  return (
    <div className="space-y-6">
      {/* 4-Step Progress Banner */}
      <div className="bg-ivory-cream rounded-2xl p-4 border border-ink-border/70 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-forest-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-forest-600" />
            Decision Twin Flow
          </span>
          <span className="text-[10px] text-ink-muted">Official Production Prep Sheet</span>
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
          <div className="p-2.5 rounded-xl bg-white border border-ink-border text-ink-muted flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-forest-800/20 text-forest-900 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
            <div>
              <span className="font-semibold block">Pick Better Plan</span>
              <span className="text-[10px]">Compare 3 choices</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-forest-50 border-2 border-forest-600 text-forest-900 flex items-center gap-2 shadow-sm">
            <span className="w-5 h-5 rounded-full bg-forest-800 text-ivory flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
            <div>
              <span className="font-bold block">Production Schedule</span>
              <span className="text-[10px] text-forest-700">Kitchen prep batch sheet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-ivory rounded-2xl p-6 border border-ink-border/60 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-forest-800">
                Shift Schedule & Prep Orders
              </span>
              <StatusBadge status={plan.feasibility_status} size="sm" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-ink mt-0.5">
              Tomorrow&apos;s Service Plan: {plan.title}
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-3xl">
              {plan.summary_explanation}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onNavigateToSimulator}
              className="px-4 py-2 border border-ink-border hover:bg-ivory-cream text-ink text-xs font-semibold rounded-xl transition"
            >
              Modify in Simulator
            </button>
            <button
              onClick={onOpenReceipt}
              className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-xl shadow transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-forest-500" />
              <span>Evidence Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Stage Prep Strategy Card (Crucial for Restaurants with Reservations + Walk-ins) */}
      {plan.two_stage_prep && (
        <div className="bg-gradient-to-br from-forest-50 to-ivory rounded-2xl border-2 border-forest-600/40 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-forest-800 text-ivory flex items-center justify-center font-bold">
                <Utensils className="w-4 h-4 text-forest-500" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-forest-900">
                  Two-Stage Kitchen Prep Strategy
                </h3>
                <span className="text-xs text-forest-700">
                  Protects availability for walk-ins without wasting a single gram of cooked food.
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-forest-800 text-ivory self-start sm:self-auto">
              Zero Food Waste Guarantee
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stage 1: Hot Line */}
            <div className="p-4 rounded-xl bg-white border border-forest-600/30 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-forest-800">
                <Flame className="w-5 h-5 text-terracotta shrink-0" />
                <span className="font-bold text-sm text-ink">
                  Stage 1: Pre-Service Hot Line (Prepped by 4:30 PM)
                </span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                {plan.two_stage_prep.stage_1_label}
              </p>
              <div className="pt-2 border-t border-ink-border/40 flex items-center justify-between text-xs">
                <span className="text-ink-muted">Prepped for Confirmed Diners:</span>
                <span className="font-mono font-bold text-forest-900 tabular-nums">
                  {plan.two_stage_prep.stage_1_portions} portions
                </span>
              </div>
            </div>

            {/* Stage 2: Cold Reserve */}
            <div className="p-4 rounded-xl bg-white border border-forest-600/30 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-forest-800">
                <Snowflake className="w-5 h-5 text-forest-600 shrink-0" />
                <span className="font-bold text-sm text-ink">
                  Stage 2: Quick-Fire Cold Reserve (Mise-en-Place in Cooler)
                </span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                {plan.two_stage_prep.stage_2_label}
              </p>
              <div className="pt-2 border-t border-ink-border/40 flex items-center justify-between text-xs">
                <span className="text-ink-muted">Kept Raw & Cold for Walk-ins:</span>
                <span className="font-mono font-bold text-forest-900 tabular-nums">
                  {plan.two_stage_prep.stage_2_portions} portions buffer
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-forest-100/50 rounded-xl text-xs text-forest-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Why this eliminates food waste:</span>
              <p className="text-[11px] text-forest-800">
                {plan.two_stage_prep.details.join(' ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Prep Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Dishes and Ingredient Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Planned Dishes */}
          <div className="bg-ivory rounded-2xl border border-ink-border/60 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
                <CookingPot className="w-4 h-4 text-forest-700" />
                <span>Planned Dishes & Prep Batching</span>
              </h3>
              <span className="text-xs text-forest-700 font-medium">
                {isRestaurant ? 'Fixed Printed Menu Recipes' : 'Standard Kitchen Recipes'}
              </span>
            </div>

            <div className="divide-y divide-ink-border/40">
              {plan.planned_items.map((item) => (
                <div key={item.recipe_id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-ink text-sm flex items-center gap-2">
                      <span>{item.recipe_name}</span>
                      <div className="flex gap-1">
                        {item.dietary_tags.map((tag) => (
                          <span key={tag} className="text-[10px] bg-forest-50 text-forest-800 px-1.5 py-0.2 rounded font-mono uppercase">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px] text-ink-muted">
                      Standard portion prep @ ${item.cost_per_portion.toFixed(2)} / portion
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-serif font-bold text-base text-ink tabular-nums block">
                      {item.portions} portions
                    </span>
                    <span className="text-[11px] text-ink-muted font-mono">
                      ${item.total_cost.toFixed(2)} batch cost
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ingredient Requirements & Allocated Stock */}
          <div className="bg-ivory rounded-2xl border border-ink-border/60 p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
              <Boxes className="w-4 h-4 text-forest-700" />
              <span>Ingredient Stock Allocation (First-Expiring First-Used)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-cream border-b border-ink-border/60 text-ink-muted text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Ingredient</th>
                    <th className="py-2.5 px-2 text-right">Required</th>
                    <th className="py-2.5 px-3">Allocation Source</th>
                    <th className="py-2.5 px-2 text-right">Purchases Needed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-border/40 font-sans">
                  {plan.ingredient_requirements.map((req) => {
                    const alloc = plan.inventory_allocated.find((a) => a.ingredient_id === req.ingredient_id);
                    const shortage = plan.shortages.find((s) => s.ingredient_id === req.ingredient_id);

                    return (
                      <tr key={req.ingredient_id} className="hover:bg-forest-50/50">
                        <td className="py-2.5 px-3 font-medium text-ink">{req.ingredient_name}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold tabular-nums">
                          {req.total_qty_needed} {req.unit}
                        </td>
                        <td className="py-2.5 px-3">
                          {alloc ? (
                            <span className="text-[11px] font-mono text-forest-800 flex items-center gap-1">
                              <span>Lot {alloc.batch_code}</span>
                              {alloc.was_at_risk && (
                                <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold uppercase">
                                  Rescued Stock
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-[11px] text-ink-muted">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                          {shortage ? (
                            <span className="text-terracotta font-bold">
                              +{shortage.shortage_qty} {shortage.unit}
                            </span>
                          ) : (
                            <span className="text-forest-700 font-semibold">Fully In Stock</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Purchasing & Prep Limitations */}
        <div className="space-y-6">
          {/* Purchasing Card */}
          <div className="bg-ivory rounded-2xl border border-ink-border/60 p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-forest-700" />
              <span>Proposed Purchasing</span>
            </h3>

            {plan.purchases_required.length === 0 ? (
              <div className="p-4 rounded-xl bg-forest-50 text-forest-800 text-xs border border-forest-600/30">
                Zero new purchases required. Current inventory covers 100% of ingredient demands without extra cash outlay.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="divide-y divide-ink-border/40 text-xs">
                  {plan.purchases_required.map((p) => (
                    <div key={p.ingredient_id} className="py-2 flex justify-between">
                      <div>
                        <div className="font-medium text-ink">{p.ingredient_name}</div>
                        <div className="text-[10px] text-ink-muted font-mono">
                          Short: {p.shortage_qty} {p.unit} &rarr; Order: {p.order_qty} {p.unit} (pack {p.pack_size})
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold tabular-nums text-ink">
                        ${p.purchase_cost.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-ink-border/60 flex justify-between text-xs font-bold text-ink">
                  <span>Total Purchase Spend</span>
                  <span className="font-mono text-forest-800 text-sm">
                    ${plan.total_purchase_cost.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Operational Boundaries */}
          <div className="bg-ivory-cream rounded-2xl border border-ink-border/60 p-6 shadow-sm space-y-3 text-xs">
            <h4 className="font-serif text-base font-bold text-ink">
              Kitchen Operational Limits
            </h4>
            <div className="space-y-2 text-ink-muted">
              <div className="flex justify-between">
                <span>Kitchen Capacity Ceiling:</span>
                <span className="font-mono font-medium text-ink">{kitchen.capacity_meals_per_service} portions</span>
              </div>
              <div className="flex justify-between">
                <span>Delayed Suppliers:</span>
                <span className="font-mono font-medium text-forest-800">
                  {plan.feasibility_status === 'FEASIBLE' ? 'Handled (0 Blockers)' : 'Review Required'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Dietary Policy:</span>
                <span className="font-mono font-medium text-forest-800">
                  {kitchen.dietary_strictness === 'clinical_strict' ? 'Clinical Strict' : 'Multi-Dietary Standard'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Food Safety Gate:</span>
                <span className="font-mono font-medium text-forest-800">Active (Quarantined Items Blocked)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
