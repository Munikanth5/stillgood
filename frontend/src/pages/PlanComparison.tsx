import React from 'react';
import { PlanEvaluation } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  CookingPot,
  Boxes,
  DollarSign,
  TrendingUp,
  Ban,
  Sparkles,
  Utensils,
  Flame,
  Snowflake,
  Info
} from 'lucide-react';

interface PlanComparisonProps {
  planA: PlanEvaluation | null;
  planB: PlanEvaluation | null;
  planC: PlanEvaluation | null;
  rejectedCandidates: PlanEvaluation[];
  onOpenReceipt: () => void;
  onOpenApproval: (plan: PlanEvaluation) => void;
}

export const PlanComparison: React.FC<PlanComparisonProps> = ({
  planA,
  planB,
  planC,
  rejectedCandidates,
  onOpenReceipt,
  onOpenApproval
}) => {
  if (!planA || !planB || !planC) {
    return (
      <div className="p-12 text-center bg-ivory rounded-2xl border border-ink-border text-ink-muted text-sm space-y-3">
        <AlertTriangle className="w-8 h-8 text-terracotta mx-auto" />
        <p>No active scenario simulation loaded. Please analyze a disruption or trigger the Simulator first.</p>
      </div>
    );
  }

  const plans = [
    {
      key: 'plan_a',
      data: planA,
      isBest: false,
      badge: 'Wasteful Baseline',
      plainSummary: 'Cooks normal high volume. Ignores cancellations. High quantity of prepared food thrown in the trash.'
    },
    {
      key: 'plan_b',
      data: planB,
      isBest: false,
      badge: 'Blind Proportional Cut',
      plainSummary: 'Cuts all dishes equally. Leaves perishable ingredients to rot in the walk-in cooler tomorrow.'
    },
    {
      key: 'plan_c',
      data: planC,
      isBest: true,
      badge: 'STILLGOOD Smart Winner',
      plainSummary: 'Scales hot prep for confirmed diners, pairs expiring produce into fixed specials, and holds cold reserve for walk-ins.'
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4-Step Progress Banner */}
      <div className="bg-ivory-cream rounded-2xl p-4 border border-ink-border/70 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-forest-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-forest-600" />
            Decision Twin Flow
          </span>
          <span className="text-[10px] text-ink-muted">Currently in Step 3</span>
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
              <span className="font-bold block">Pick Better Plan</span>
              <span className="text-[10px] text-forest-700">Compare 3 choices side-by-side</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-ink-border text-ink-muted flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-ink-border text-ink flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
            <div>
              <span className="font-semibold block">Authorize Cooks</span>
              <span className="text-[10px]">1-click lock & commit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-ivory rounded-2xl p-6 border border-ink-border/60 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink">Alternative Plan Comparison</h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-3xl">
              Compare your options objectively. STILLGOOD checks every choice against actual inventory, recipes, supplier delays, and food safety limits.
            </p>
          </div>
          <button
            onClick={onOpenReceipt}
            className="px-4 py-2.5 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-xl shadow transition flex items-center gap-2 self-start sm:self-auto"
          >
            <FileText className="w-4 h-4 text-forest-500" />
            <span>Inspect Evidence Receipt</span>
          </button>
        </div>
      </div>

      {/* Fixed Menu Safeguard Notice */}
      <div className="p-4 rounded-xl bg-forest-50/70 border border-forest-600/30 flex items-start gap-3 text-xs text-forest-900">
        <Utensils className="w-5 h-5 text-forest-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Fixed-Menu Integrity Safeguard</span>
          <p className="text-forest-800 text-[11px] leading-relaxed">
            All proposed dishes come strictly from your authorized fixed menu recipes. STILLGOOD never hallucinates off-menu ingredients, ensuring cooks know exactly how to execute every dish.
          </p>
        </div>
      </div>

      {/* 3-Column Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(({ key, data, isBest, badge, plainSummary }) => (
          <div
            key={key}
            className={`rounded-2xl border p-6 flex flex-col justify-between transition ${
              isBest
                ? 'bg-[#F4F8F4] border-forest-600 shadow-md ring-2 ring-forest-600/20'
                : 'bg-ivory border-ink-border/70 shadow-sm'
            }`}
          >
            <div className="space-y-4">
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isBest
                      ? 'bg-forest-800 text-ivory'
                      : 'bg-ivory-cream text-ink-muted border border-ink-border/50'
                  }`}
                >
                  {badge}
                </span>
                <StatusBadge status={data.feasibility_status} size="sm" />
              </div>

              {/* Title & Plain English Summary */}
              <div>
                <h3 className="font-serif text-lg font-bold text-ink">{data.title}</h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">{data.subtitle}</p>
                <div className="mt-2 p-2.5 rounded-lg bg-white/80 border border-ink-border/40 text-[11px] text-ink leading-relaxed">
                  <span className="font-bold text-ink-muted block text-[10px] uppercase">What cooks do:</span>
                  {plainSummary}
                </div>
              </div>

              {/* Key Comparative Metrics Table */}
              <div className="space-y-2 py-3 border-y border-ink-border/40 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted">Diners Covered:</span>
                  <span className="font-mono font-semibold tabular-nums text-ink">
                    {data.meals_covered} covers
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted">Total Portions Prepped:</span>
                  <span className="font-mono font-semibold tabular-nums text-ink">
                    {data.total_portions} portions
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted">Unserved Food Waste:</span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      data.expected_surplus_meals > 0 ? 'text-terracotta' : 'text-forest-700'
                    }`}
                  >
                    {data.expected_surplus_meals > 0 ? `${data.expected_surplus_meals} meals wasted` : '0 meals (Zero Waste)'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted">Purchasing Spend:</span>
                  <span className="font-mono font-semibold tabular-nums text-ink">
                    ${data.total_purchase_cost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted">Perishables Rescued:</span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      data.at_risk_inventory_utilized_kg > 0 ? 'text-forest-700' : 'text-ink-muted'
                    }`}
                  >
                    {data.at_risk_inventory_utilized_kg > 0 ? `${data.at_risk_inventory_utilized_kg} kg saved` : '0 kg rescued'}
                  </span>
                </div>
              </div>

              {/* Two-Stage Prep Pill if Present */}
              {data.two_stage_prep && (
                <div className="p-3 bg-forest-100/60 rounded-xl border border-forest-600/30 text-xs space-y-1">
                  <div className="font-bold text-forest-900 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-forest-700" />
                    <span>Two-Stage Kitchen Prep</span>
                  </div>
                  <div className="text-[11px] text-forest-800">
                    🔥 Hot Line: {data.two_stage_prep.stage_1_portions} portions • ❄️ Cold Reserve: {data.two_stage_prep.stage_2_portions} portions
                  </div>
                </div>
              )}

              {/* Menu items summary */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
                  Planned Fixed Menu Dishes
                </span>
                <div className="space-y-1">
                  {data.planned_items.map((item) => (
                    <div key={item.recipe_id} className="flex justify-between text-xs py-0.5">
                      <span className="text-ink line-clamp-1">{item.recipe_name}</span>
                      <span className="font-mono text-ink-muted ml-2">{item.portions}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection / Failure Notice if Infeasible */}
              {!data.is_recommended && data.rejection_reasons.length > 0 && (
                <div className="p-3 rounded-xl bg-terracotta-bg border border-terracotta/40 text-[11px] text-terracotta-dark space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Why This Choice Fails:
                  </span>
                  {data.rejection_reasons.map((r, idx) => (
                    <div key={idx}>• {r}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Action */}
            <div className="pt-6">
              {isBest ? (
                <button
                  onClick={() => onOpenApproval(data)}
                  className="w-full py-3 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-xl shadow transition flex items-center justify-center gap-2 group"
                >
                  <CheckCircle2 className="w-4 h-4 text-forest-500 group-hover:scale-110 transition" />
                  <span>Authorize & Approve Plan C (Step 4)</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 bg-gray-200 text-gray-500 text-xs font-semibold rounded-xl cursor-not-allowed text-center"
                >
                  Infeasible Choice — Cannot Authorize
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Visibly Rejected Candidates Section (Integrity Gate) */}
      {rejectedCandidates.length > 0 && (
        <div className="bg-ivory rounded-2xl p-6 border border-ink-border/60 shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
            <Ban className="w-5 h-5 text-terracotta" />
            <span>Visibly Rejected Alternatives (Safety & Integrity Gates)</span>
          </h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            STILLGOOD never pretends an unsafe or impossible plan is acceptable. The engine explicitly tested and rejected these options:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rejectedCandidates.map((cand) => (
              <div
                key={cand.plan_id}
                className="p-4 rounded-xl bg-terracotta-bg/40 border border-terracotta/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">{cand.title}</span>
                  <span className="text-[10px] font-bold bg-terracotta text-ivory px-2 py-0.5 rounded uppercase">
                    REJECTED
                  </span>
                </div>
                <div className="text-ink-muted text-[11px]">{cand.subtitle}</div>
                <div className="p-2.5 bg-white/70 rounded-lg border border-terracotta/30 text-terracotta-dark space-y-1">
                  {cand.rejection_reasons.map((r, rIdx) => (
                    <div key={rIdx} className="font-medium">• {r}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
