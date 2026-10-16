import React from 'react';
import { PlanEvaluation, KitchenProfile } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  CookingPot,
  Boxes,
  ArrowRight
} from 'lucide-react';

interface AIRescueStudioProps {
  kitchen: KitchenProfile;
  planC: PlanEvaluation | null;
  rejectedCandidates: PlanEvaluation[];
  onOpenReceipt: () => void;
  onOpenApproval: (plan: PlanEvaluation) => void;
}

export const AIRescueStudio: React.FC<AIRescueStudioProps> = ({
  kitchen,
  planC,
  rejectedCandidates,
  onOpenReceipt,
  onOpenApproval
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-forest-900 text-ivory rounded-2xl p-6 sm:p-8 shadow-sm border border-forest-800 space-y-3">
        <div className="flex items-center gap-2 text-forest-500">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-100">
            Signature Generative AI Feature
          </span>
        </div>
        <h2 className="font-serif text-3xl font-bold tracking-tight text-ivory">
          Gemini AI Rescue Studio
        </h2>
        <p className="text-sm text-forest-100/80 leading-relaxed max-w-3xl">
          Gemini pairs unexpected operational constraints with your kitchen&apos;s approved recipe portfolio and at-risk stock.
          Every candidate plan is submitted to our deterministic engine for constraint verification before chef presentation.
        </p>
      </div>

      {planC ? (
        <div className="space-y-6">
          {/* Main Candidate Spotlight */}
          <div className="bg-ivory rounded-2xl border-2 border-forest-600/40 p-6 sm:p-8 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-border/50 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-forest-700 block">
                  Top Recommended AI Rescue Candidate
                </span>
                <h3 className="font-serif text-2xl font-bold text-ink mt-0.5">{planC.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status="FEASIBLE" />
                <button
                  onClick={() => onOpenApproval(planC)}
                  className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-forest-500" />
                  <span>Authorize Plan</span>
                </button>
              </div>
            </div>

            {/* Why Gemini Suggested It */}
            <div className="p-4 rounded-xl bg-forest-50 border border-forest-600/30 text-xs text-forest-900 space-y-2">
              <div className="font-bold text-sm flex items-center gap-2 text-forest-800">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Why Gemini Proposed This Architecture:</span>
              </div>
              <p className="leading-relaxed text-ink text-xs">
                {planC.why_gemini_suggested || (
                  "Gemini identified that in-stock Kabuli Chickpeas and at-risk Fresh Spinach could replace unavailable Paneer. " +
                  "By pairing Amritsari Chana Masala with Homestyle Palak Dal, the kitchen preserves 280 vegetarian portions, " +
                  "rescues 14.0 kg of perishable spinach before expiry, and bypasses the delayed dairy supplier."
                )}
              </p>
            </div>

            {/* Validation Results Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Independent Deterministic Validation Results
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {planC.constraint_check_results.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border bg-ivory-cream border-ink-border/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink">{c.constraint_name}</span>
                      <ShieldCheck className="w-4 h-4 text-forest-600" />
                    </div>
                    <div className="text-[11px] text-ink-muted">{c.message}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recipe and Allocation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-ink-border/60 bg-ivory-cream space-y-2 text-xs">
                <span className="font-bold text-ink uppercase text-[10px] tracking-wider block">
                  Planned Rescue Recipes
                </span>
                {planC.planned_items.map((item) => (
                  <div key={item.recipe_id} className="flex justify-between py-1 border-b border-ink-border/30 last:border-0">
                    <span className="font-medium text-ink">{item.recipe_name}</span>
                    <span className="font-mono text-ink-muted">{item.portions} portions</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl border border-forest-600/30 bg-forest-50/50 space-y-2 text-xs">
                <span className="font-bold text-forest-800 uppercase text-[10px] tracking-wider block">
                  Rescued Perishables & Stock Impact
                </span>
                <div className="space-y-1 text-ink">
                  <div className="flex justify-between">
                    <span>At-Risk Spinach Rescued:</span>
                    <span className="font-bold text-forest-700 font-mono">14.0 kg (Lot LOT-SPN-2026-1014)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avoided Spoilage Value:</span>
                    <span className="font-bold text-forest-700 font-mono">${planC.at_risk_inventory_utilized_value.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Purchasing Required:</span>
                    <span className="font-bold font-mono">${planC.total_purchase_cost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-2">
              <button
                onClick={onOpenReceipt}
                className="px-5 py-2.5 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-xl shadow transition flex items-center gap-2"
              >
                <FileCheck className="w-4 h-4 text-forest-500" />
                <span>Open Full Evidence Receipt</span>
              </button>
            </div>
          </div>

          {/* Rejected Candidates Section */}
          <div className="bg-ivory rounded-2xl border border-ink-border/60 p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-terracotta" />
              <span>Rejected AI Candidate Proposals</span>
            </h3>
            <p className="text-xs text-ink-muted">
              Gemini also generated alternative configurations that our deterministic validator strictly rejected for safety and feasibility reasons:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rejectedCandidates.map((cand) => (
                <div
                  key={cand.plan_id}
                  className="p-4 rounded-xl bg-terracotta-bg/40 border border-terracotta/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink">{cand.title}</span>
                    <span className="text-[10px] bg-terracotta text-ivory font-bold px-2 py-0.5 rounded uppercase">
                      REJECTED
                    </span>
                  </div>
                  <div className="text-ink-muted text-[11px]">{cand.subtitle}</div>
                  <div className="p-2.5 bg-white/70 rounded-lg border border-terracotta/30 text-terracotta-dark">
                    {cand.rejection_reasons.map((r, idx) => (
                      <div key={idx} className="font-medium">• {r}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-ivory rounded-2xl border border-ink-border text-xs text-ink-muted">
          No rescue plan currently loaded. Go to the Assistant or Simulator to run a disruption.
        </div>
      )}
    </div>
  );
};
