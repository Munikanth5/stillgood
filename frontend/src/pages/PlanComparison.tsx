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
  Ban
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
    { key: 'plan_a', data: planA, isBest: false, badge: 'Infeasible Baseline' },
    { key: 'plan_b', data: planB, isBest: false, badge: 'Infeasible Scaling' },
    { key: 'plan_c', data: planC, isBest: true, badge: 'STILLGOOD Winner' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-ivory rounded-2xl p-6 border border-ink-border/60 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink">Alternative Plan Comparison</h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              Objective comparison of baseline inertia, proportional scaling, and STILLGOOD smart rescue.
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

      {/* 3-Column Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(({ key, data, isBest, badge }) => (
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

              {/* Title */}
              <div>
                <h3 className="font-serif text-lg font-bold text-ink">{data.title}</h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">{data.subtitle}</p>
              </div>

              {/* Key Comparative Metrics Table */}
              <div className="space-y-2 py-3 border-y border-ink-border/40 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted">Meals Covered / Target:</span>
                  <span className="font-mono font-semibold tabular-nums text-ink">
                    {data.meals_covered} / 350
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted">Total Prep Batches:</span>
                  <span className="font-mono font-semibold tabular-nums text-ink">
                    {data.total_portions} portions
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted">Projected Surplus:</span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      data.expected_surplus_meals > 0 ? 'text-terracotta' : 'text-forest-700'
                    }`}
                  >
                    {data.expected_surplus_meals} meals
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted">Purchasing Spend:</span>
                  <span className="font-mono font-semibold tabular-nums text-ink">
                    ${data.total_purchase_cost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted">At-Risk Rescued:</span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      data.at_risk_inventory_utilized_kg > 0 ? 'text-forest-700' : 'text-ink-muted'
                    }`}
                  >
                    {data.at_risk_inventory_utilized_kg} kg
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted">Complexity:</span>
                  <span className="font-semibold text-ink">{data.operational_complexity}</span>
                </div>
              </div>

              {/* Menu items summary */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
                  Planned Menu Items
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
                    Failed Constraints:
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
                  className="w-full py-3 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-xl shadow transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-forest-500" />
                  <span>Authorize & Approve Plan C</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 bg-gray-200 text-gray-500 text-xs font-semibold rounded-xl cursor-not-allowed text-center"
                >
                  Infeasible — Cannot Approve
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
            <span>Visibly Rejected Alternatives (Deterministic Gate Enforcement)</span>
          </h3>
          <p className="text-xs text-ink-muted">
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
